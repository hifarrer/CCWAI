import { prisma } from '@/lib/db/client'
import { TrialMatchCriteria } from '@/lib/types'

// Map cancer types to search terms for ClinicalTrials.gov
const cancerTypeMap: Record<string, string> = {
  breast: 'breast cancer',
  lung: 'lung cancer',
  colorectal: 'colorectal cancer',
  prostate: 'prostate cancer',
  pancreatic: 'pancreatic cancer',
  liver: 'liver cancer',
  stomach: 'stomach cancer',
  esophageal: 'esophageal cancer',
  bladder: 'bladder cancer',
  kidney: 'kidney cancer',
  cervical: 'cervical cancer',
  ovarian: 'ovarian cancer',
  leukemia: 'leukemia',
  lymphoma: 'lymphoma',
  melanoma: 'melanoma',
  brain: 'brain cancer',
}

interface ClinicalTrialsApiResponse {
  studies: Array<{
    protocolSection: {
      identificationModule: {
        nctId: string
        briefTitle: string
        officialTitle: string
      }
      statusModule: {
        overallStatus: string
        recruitmentStatus?: string
      }
      conditionsModule: {
        conditions: string[]
      }
      eligibilityModule: {
        eligibilityCriteria?: string
        minimumAge?: string
        maximumAge?: string
      }
      contactsLocationsModule?: {
        locations?: Array<{
          location: {
            facility?: string
            city?: string
            state?: string
            zip?: string
            country?: string
          }
        }>
      }
      descriptionModule?: {
        briefSummary?: string
      }
    }
  }>
  nextPageToken?: string
}

/**
 * Searches for clinical trials matching the user's criteria and saves them to the database.
 * This function runs in the background and does not return results to the user.
 */
export async function searchAndSaveTrialsForUser(
  userId: string,
  criteria: TrialMatchCriteria
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log(`[UserTrialMatch] Starting trial search for user ${userId}`, criteria)

    // Build query string for ClinicalTrials.gov API
    const queryParts: string[] = []

    // Add search term to query (map cancer type to proper search term)
    if (criteria.cancerType && criteria.cancerType.trim()) {
      const searchTerm = cancerTypeMap[criteria.cancerType] || criteria.cancerType.trim()
      queryParts.push(searchTerm)
    }

    // Add mutations to query
    if (criteria.mutations && criteria.mutations.length > 0) {
      queryParts.push(...criteria.mutations)
    }

    // Build the API request
    const baseUrl = 'https://clinicaltrials.gov/api/v2/studies'
    const params = new URLSearchParams({
      format: 'json',
      pageSize: '50', // Get more results for user matching
    })

    // Add query term if we have search terms
    if (queryParts.length > 0) {
      params.append('query.term', queryParts.join(' '))
    }

    // Add status filter - default to recruiting trials
    const statusFilter = criteria.status && criteria.status.length > 0
      ? criteria.status.join('|')
      : 'RECRUITING|NOT_YET_RECRUITING|ENROLLING_BY_INVITATION'
    params.append('filter.overallStatus', statusFilter)

    // For zip code, convert to coordinates and use filter.geo
    if (criteria.zipCode && criteria.zipCode.trim()) {
      try {
        // Use Nominatim (OpenStreetMap) geocoding service to convert zip code to coordinates
        await new Promise(resolve => setTimeout(resolve, 1000))
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(criteria.zipCode.trim())}&country=US&format=json&limit=1`
        const geoResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'CCWAI-ClinicalTrials/1.0'
          }
        })
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          if (geoData && geoData.length > 0) {
            const lat = parseFloat(geoData[0].lat)
            const lon = parseFloat(geoData[0].lon)
            // Use 50 mile radius for location search
            params.append('filter.geo', `distance(${lat},${lon},50mi)`)
          }
        }
      } catch (geoError) {
        console.error('[UserTrialMatch] Geocoding error:', geoError)
      }
    }

    const apiUrl = `${baseUrl}?${params.toString()}`
    console.log(`[UserTrialMatch] Fetching trials from: ${apiUrl}`)

    // Fetch from ClinicalTrials.gov API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[UserTrialMatch] API error: ${response.status} ${response.statusText}`)
      return { success: false, count: 0, error: `API error: ${response.status}` }
    }

    const data: ClinicalTrialsApiResponse = await response.json()
    const studies = data.studies || []

    console.log(`[UserTrialMatch] Found ${studies.length} trials for user ${userId}`)

    // Extract NCT IDs from the studies
    const nctIds = studies
      .filter((study) => study && study.protocolSection)
      .map((study) => study.protocolSection.identificationModule?.nctId)
      .filter((nctId): nctId is string => Boolean(nctId))

    if (nctIds.length === 0) {
      console.log(`[UserTrialMatch] No valid trials found for user ${userId}`)
      return { success: true, count: 0 }
    }

    // Delete existing matches for this user (to refresh the list)
    await prisma.userTrialMatch.deleteMany({
      where: { userId },
    })

    // Save new matches
    const matches = nctIds.map((nctId) => ({
      userId,
      nctId,
    }))

    // Use createMany for better performance, but handle potential duplicates
    let savedCount = 0
    for (const match of matches) {
      try {
        await prisma.userTrialMatch.create({
          data: match,
        })
        savedCount++
      } catch (error: any) {
        // Ignore unique constraint errors (shouldn't happen after deleteMany, but just in case)
        if (error.code !== 'P2002') {
          console.error(`[UserTrialMatch] Error saving match:`, error)
        }
      }
    }

    console.log(`[UserTrialMatch] Saved ${savedCount} trial matches for user ${userId}`)

    return { success: true, count: savedCount }
  } catch (error) {
    console.error(`[UserTrialMatch] Error searching and saving trials for user ${userId}:`, error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

