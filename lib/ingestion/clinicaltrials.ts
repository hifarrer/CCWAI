import { prisma } from '@/lib/db/client'

interface ClinicalTrialEntry {
  nct_id: string
  title: string
  description?: string
  conditions: string[]
  eligibility_criteria?: string
  locations?: any[]
  status: string
  start_date?: string
  completion_date?: string
  intervention_type?: string
  keywords?: string[]
}

export async function ingestClinicalTrials(trialsData?: any[]) {
  // In production, this would fetch from ClinicalTrials.gov API
  // For now, this is a placeholder structure

  if (!trialsData || trialsData.length === 0) {
    console.log('No clinical trials data provided')
    return { ingested: 0, errors: [] }
  }

  const errors: Error[] = []
  let ingested = 0

  for (const trial of trialsData) {
    try {
      const nctId = trial.nct_id || trial.id

      // Check if trial already exists
      const existing = await prisma.clinicalTrial.findUnique({
        where: { nctId },
      })

      if (existing) {
        // Update if data has changed
        await prisma.clinicalTrial.update({
          where: { nctId },
          data: {
            title: trial.title,
            description: trial.description || null,
            conditions: trial.conditions || [],
            eligibilityCriteria: trial.eligibility_criteria || null,
            locations: trial.locations || null,
            status: trial.status || null,
            startDate: trial.start_date ? new Date(trial.start_date) : null,
            completionDate: trial.completion_date ? new Date(trial.completion_date) : null,
            interventionType: trial.intervention_type || null,
            keywords: trial.keywords || [],
          },
        })

        await prisma.dataIngestionLog.create({
          data: {
            source: 'clinicaltrials',
            recordId: nctId,
            recordType: 'clinical_trial',
            action: 'updated',
            metadata: {},
          },
        })
        continue
      }

      // Create new trial
      await prisma.clinicalTrial.create({
        data: {
          nctId,
          title: trial.title,
          description: trial.description || null,
          conditions: trial.conditions || [],
          eligibilityCriteria: trial.eligibility_criteria || null,
          locations: trial.locations || null,
          status: trial.status || null,
          startDate: trial.start_date ? new Date(trial.start_date) : null,
          completionDate: trial.completion_date ? new Date(trial.completion_date) : null,
          interventionType: trial.intervention_type || null,
          keywords: trial.keywords || [],
        },
      })

      await prisma.dataIngestionLog.create({
        data: {
          source: 'clinicaltrials',
          recordId: nctId,
          recordType: 'clinical_trial',
          action: 'created',
          metadata: {},
        },
      })

      ingested++
    } catch (error) {
      console.error('Error ingesting trial:', error)
      errors.push(error as Error)
    }
  }

  return { ingested, errors }
}

