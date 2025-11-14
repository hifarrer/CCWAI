import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TrialsClient } from './TrialsClient'

interface PageProps {
  searchParams: {
    cancerType?: string
    status?: string
    page?: string
  }
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
}

export default async function TrialsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  // Get user's trial matches
  const userMatches = await prisma.userTrialMatch.findMany({
    where: { userId },
    select: { nctId: true },
    orderBy: { matchedAt: 'desc' },
  })

  let initialTrials: any[] = []
  let initialTotal = 0
  let initialTotalPages = 0

  if (userMatches.length > 0) {
    let nctIds = userMatches.map((m) => m.nctId)

    // Filter by cancer type if provided
    if (searchParams.cancerType) {
      const trialsInDb = await prisma.clinicalTrial.findMany({
        where: {
          nctId: { in: nctIds },
          conditions: { has: searchParams.cancerType },
        },
        select: { nctId: true },
      })
      
      if (trialsInDb.length > 0) {
        const matchingNctIds = trialsInDb.map(t => t.nctId)
        nctIds = nctIds.filter(id => matchingNctIds.includes(id))
      }
    }

    initialTotal = nctIds.length
    initialTotalPages = Math.ceil(initialTotal / limit)

    // Apply pagination
    const paginatedNctIds = nctIds.slice(offset, offset + limit)

    if (paginatedNctIds.length > 0) {
      // Fetch trial details from ClinicalTrials.gov API
      // Query by nctId using OR operator
      const nctIdQuery = paginatedNctIds.join(' OR ')
      
      try {
        const apiUrl = `https://clinicaltrials.gov/api/v2/studies?format=json&query.term=${encodeURIComponent(nctIdQuery)}&pageSize=${paginatedNctIds.length}`
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
            if (searchParams.status) {
              const trialStatus = statusModule.recruitmentStatus || statusModule.overallStatus
              if (trialStatus !== searchParams.status) continue
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

            initialTrials.push({
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
        console.error(`[TrialsPage] Error fetching trials:`, error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <TrialsClient
          initialTrials={initialTrials}
          initialTotal={initialTotal}
          initialPage={page}
          initialTotalPages={initialTotalPages}
          initialFilters={{
            cancerType: searchParams.cancerType,
            status: searchParams.status,
          }}
        />
      </main>
      <Footer />
    </div>
  )
}

