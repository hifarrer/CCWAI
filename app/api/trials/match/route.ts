import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TrialMatchCriteria } from '@/lib/types'
import { prisma } from '@/lib/db/client'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const criteria: TrialMatchCriteria = await request.json()

    // Log input criteria
    console.log('[ClinicalTrials] Search criteria:', JSON.stringify(criteria, null, 2))

    // Build query string for ClinicalTrials.gov API
    const queryParts: string[] = []

    // Add search term to query (treat cancerType as general search term now)
    if (criteria.cancerType && criteria.cancerType.trim()) {
      queryParts.push(criteria.cancerType.trim())
    }

    // Add mutations to query
    if (criteria.mutations && criteria.mutations.length > 0) {
      queryParts.push(...criteria.mutations)
    }

    // Build the API request
    const baseUrl = 'https://clinicaltrials.gov/api/v2/studies'
    const params = new URLSearchParams({
      format: 'json',
      pageSize: '10',
    })

    // Add query term if we have search terms
    if (queryParts.length > 0) {
      params.append('query.term', queryParts.join(' '))
    }

    // Add status filter - use selected statuses or default to recruiting trials
    const statusFilter = criteria.status && criteria.status.length > 0
      ? criteria.status.join('|')
      : 'RECRUITING|NOT_YET_RECRUITING|ENROLLING_BY_INVITATION'
    params.append('filter.overallStatus', statusFilter)

    // For zip code, convert to coordinates and use filter.geo
    if (criteria.zipCode && criteria.zipCode.trim()) {
      try {
        // Use Nominatim (OpenStreetMap) geocoding service to convert zip code to coordinates
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(criteria.zipCode.trim())}&country=US&format=json&limit=1`
        const geoResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'CCWAI-ClinicalTrials/1.0' // Required by Nominatim
          }
        })
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          if (geoData && geoData.length > 0) {
            const lat = parseFloat(geoData[0].lat)
            const lon = parseFloat(geoData[0].lon)
            // Use 50 mile radius for location search
            params.append('filter.geo', `distance(${lat},${lon},50mi)`)
            console.log('[ClinicalTrials] Geocoded zip code:', {
              zip: criteria.zipCode,
              lat,
              lon,
              radius: '50mi'
            })
          } else {
            console.warn('[ClinicalTrials] Could not geocode zip code:', criteria.zipCode)
          }
        }
      } catch (geoError) {
        console.error('[ClinicalTrials] Geocoding error:', geoError)
        // Fallback: include zip in query term as before
        const currentQuery = params.get('query.term') || ''
        params.set('query.term', currentQuery ? `${currentQuery} ${criteria.zipCode}` : criteria.zipCode)
      }
    }

    const apiUrl = `${baseUrl}?${params.toString()}`
    
    // Log the query details
    console.log('[ClinicalTrials] Query parts:', queryParts)
    console.log('[ClinicalTrials] Query parameters:')
    console.log('  - query.term:', params.get('query.term') || '(none)')
    console.log('  - filter.overallStatus:', params.get('filter.overallStatus'), `(selected: ${criteria.status?.join(', ') || 'default'})`)
    console.log('  - filter.geo:', params.get('filter.geo') || '(none)')
    console.log('  - format:', params.get('format'))
    console.log('  - pageSize:', params.get('pageSize'))
    console.log('[ClinicalTrials] Full API URL:', apiUrl)
    
    // Fetch from ClinicalTrials.gov API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[ClinicalTrials] API error:', response.status, response.statusText)
      throw new Error(`ClinicalTrials.gov API error: ${response.status}`)
    }

    const data: ClinicalTrialsApiResponse = await response.json()
    console.log('[ClinicalTrials] API response:', {
      totalStudies: data.studies?.length || 0,
      nextPageToken: data.nextPageToken || null,
      studyIds: data.studies?.map(s => s.protocolSection?.identificationModule?.nctId).filter(Boolean) || []
    })

    // Transform API response to match expected format
    const trials = (data.studies || [])
      .filter((study) => study && study.protocolSection) // Filter out invalid studies
      .map((study) => {
      const protocol = study.protocolSection
      if (!protocol) {
        return null
      }
      
      const identification = protocol.identificationModule || {}
      const status = protocol.statusModule || {}
      const conditions = protocol.conditionsModule || { conditions: [] }
      const eligibility = protocol.eligibilityModule || {}
      const locations = protocol.contactsLocationsModule?.locations || []
      const description = protocol.descriptionModule

      // Extract eligibility criteria text
      let eligibilityCriteria = eligibility.eligibilityCriteria || null
      if (eligibilityCriteria) {
        // Clean up the eligibility criteria text (remove excessive whitespace)
        eligibilityCriteria = eligibilityCriteria
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500) // Limit length
      }

      // Format locations - handle different possible structures
      const formattedLocations = locations
        .filter((loc) => loc && (loc.location || loc)) // Filter out invalid entries
        .map((loc) => {
          // Handle different possible location structures
          const locationData = loc.location || loc
          if (!locationData) {
            return {
              facility: '',
              city: '',
              state: '',
              zip: '',
              country: '',
            }
          }
          
          return {
            facility: locationData.facility || '',
            city: locationData.city || '',
            state: locationData.state || '',
            zip: locationData.zip || '',
            country: locationData.country || '',
          }
        })
        .filter((loc) => loc.city || loc.state || loc.facility) // Only keep locations with some data

      return {
        id: identification.nctId || 'unknown',
        nctId: identification.nctId || 'unknown',
        title: identification.briefTitle || identification.officialTitle || 'Untitled Study',
        description: description?.briefSummary || null,
        status: status.recruitmentStatus || status.overallStatus || null,
        conditions: conditions.conditions || [],
        eligibilityCriteria,
        locations: formattedLocations,
        minimumAge: eligibility.minimumAge || null,
        maximumAge: eligibility.maximumAge || null,
      }
    })
    .filter((trial) => trial !== null) // Remove any null entries

    console.log('[ClinicalTrials] Transformed trials:', {
      count: trials.length,
      trialIds: trials.map(t => t.nctId)
    })

    // Save trials to UserTrialMatch table in the background (don't await - let it run async)
    if (trials.length > 0) {
      const nctIds = trials.map(t => t.nctId).filter((id): id is string => id !== 'unknown' && Boolean(id))
      
      // Save matches in background (don't block the response)
      prisma.userTrialMatch.createMany({
        data: nctIds.map(nctId => ({
          userId,
          nctId,
        })),
        skipDuplicates: true, // Skip if already exists
      }).then(() => {
        // Dispatch event to notify that trials were updated
        // This will be handled by the client-side code
        console.log('[ClinicalTrials] Trial matches saved successfully')
      }).catch((error) => {
        console.error('[ClinicalTrials] Error saving trial matches:', error)
        // Don't fail the request if saving fails
      })
    }

    return NextResponse.json({ trials })
  } catch (error) {
    console.error('Error matching trials:', error)
    return NextResponse.json(
      { error: 'Failed to match trials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

