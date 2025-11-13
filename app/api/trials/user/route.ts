import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

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
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const cancerType = searchParams.get('cancerType')
    const status = searchParams.get('status')

    // Get user's trial matches
    const userMatches = await prisma.userTrialMatch.findMany({
      where: { userId },
      select: { nctId: true },
      orderBy: { matchedAt: 'desc' },
    })

    if (userMatches.length === 0) {
      return NextResponse.json({
        trials: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      })
    }

    // Get all nctIds
    let nctIds = userMatches.map((m) => m.nctId)

    // If filtering by cancer type, check which trials match
    if (cancerType) {
      // Fetch trial details to check conditions
      // For now, we'll fetch all and filter client-side, or we can check ClinicalTrial table
      const trialsInDb = await prisma.clinicalTrial.findMany({
        where: {
          nctId: { in: nctIds },
          conditions: { has: cancerType },
        },
        select: { nctId: true },
      })
      
      if (trialsInDb.length > 0) {
        // Filter to only trials that match cancer type
        const matchingNctIds = trialsInDb.map(t => t.nctId)
        nctIds = nctIds.filter(id => matchingNctIds.includes(id))
      }
      // If no trials in DB, we'll fetch all and filter by checking conditions from API
    }

    // Apply pagination
    const paginatedNctIds = nctIds.slice(offset, offset + limit)

    if (paginatedNctIds.length === 0) {
      return NextResponse.json({
        trials: [],
        total: nctIds.length,
        page,
        limit,
        totalPages: Math.ceil(nctIds.length / limit),
      })
    }

    // Fetch trial details from ClinicalTrials.gov API
    // We'll fetch them in batches (API allows multiple nctIds in query)
    const trials: any[] = []
    
    // Fetch trials in batches of 10 (API limit)
    for (let i = 0; i < paginatedNctIds.length; i += 10) {
      const batch = paginatedNctIds.slice(i, i + 10)
      const nctIdQuery = batch.join(' OR ')
      
      try {
        const apiUrl = `https://clinicaltrials.gov/api/v2/studies?format=json&query.term=${encodeURIComponent(nctIdQuery)}&pageSize=10`
        const response = await fetch(apiUrl, {
          headers: { 'Accept': 'application/json' },
        })

        if (response.ok) {
          const data: ClinicalTrialsApiResponse = await response.json()
          const studies = data.studies || []

          for (const study of studies) {
            if (!study.protocolSection) continue

            const protocol = study.protocolSection
            const identification = protocol.identificationModule || {}
            const statusModule = protocol.statusModule || {}
            const conditions = protocol.conditionsModule || { conditions: [] }
            const eligibility = protocol.eligibilityModule || {}
            const locations = protocol.contactsLocationsModule?.locations || []
            const description = protocol.descriptionModule

            // Filter by status if provided
            if (status) {
              const trialStatus = statusModule.recruitmentStatus || statusModule.overallStatus
              if (trialStatus !== status) continue
            }

            // Filter by cancer type if provided and not already filtered
            if (cancerType && !nctIds.includes(identification.nctId)) {
              const trialConditions = conditions.conditions || []
              const matchesCancerType = trialConditions.some((cond: string) =>
                cond.toLowerCase().includes(cancerType.toLowerCase())
              )
              if (!matchesCancerType) continue
            }

            const formattedLocations = locations
              .filter((loc) => loc && (loc.location || loc))
              .map((loc) => {
                const locationData = loc.location || loc
                return {
                  facility: locationData.facility || '',
                  city: locationData.city || '',
                  state: locationData.state || '',
                  zip: locationData.zip || '',
                  country: locationData.country || '',
                }
              })
              .filter((loc) => loc.city || loc.state || loc.facility)

            let eligibilityCriteria = eligibility.eligibilityCriteria || null
            if (eligibilityCriteria) {
              eligibilityCriteria = eligibilityCriteria
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 500)
            }

            trials.push({
              id: identification.nctId || 'unknown',
              nctId: identification.nctId || 'unknown',
              title: identification.briefTitle || identification.officialTitle || 'Untitled Study',
              description: description?.briefSummary || null,
              status: statusModule.recruitmentStatus || statusModule.overallStatus || null,
              conditions: conditions.conditions || [],
              eligibilityCriteria,
              locations: formattedLocations,
              minimumAge: eligibility.minimumAge || null,
              maximumAge: eligibility.maximumAge || null,
            })
          }
        }
      } catch (error) {
        console.error(`[UserTrials] Error fetching batch:`, error)
      }
    }

    return NextResponse.json({
      trials,
      total: nctIds.length,
      page,
      limit,
      totalPages: Math.ceil(nctIds.length / limit),
    })
  } catch (error) {
    console.error('Error fetching user trials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trials' },
      { status: 500 }
    )
  }
}




