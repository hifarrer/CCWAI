import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ingestClinicalTrials } from '@/lib/ingestion/clinicaltrials'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const trialsData = body.data || []

    // In production, fetch from ClinicalTrials.gov API
    const result = await ingestClinicalTrials(trialsData)

    return NextResponse.json({
      success: true,
      ingested: result.ingested,
      errors: result.errors.length,
    })
  } catch (error) {
    console.error('Error ingesting trials:', error)
    return NextResponse.json(
      { error: 'Failed to ingest trials' },
      { status: 500 }
    )
  }
}




