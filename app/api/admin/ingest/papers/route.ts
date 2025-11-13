import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ingestPubMedPapers } from '@/lib/ingestion/pubmed'

export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication check
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, accept data in body or fetch from Apify
    const body = await request.json().catch(() => ({}))
    const apifyData = body.data || []

    // In production, you would:
    // 1. Call Apify API to fetch PubMed data
    // 2. Or use PubMed API directly
    // 3. Process and ingest the data

    const result = await ingestPubMedPapers(apifyData)

    return NextResponse.json({
      success: true,
      ingested: result.ingested,
      errors: result.errors.length,
    })
  } catch (error) {
    console.error('Error ingesting papers:', error)
    return NextResponse.json(
      { error: 'Failed to ingest papers' },
      { status: 500 }
    )
  }
}




