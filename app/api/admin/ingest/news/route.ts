import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ingestNewsFromRSS } from '@/lib/ingestion/news-rss'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await ingestNewsFromRSS()

    return NextResponse.json({
      success: true,
      ingested: result.ingested,
      errors: result.errors.length,
    })
  } catch (error) {
    console.error('Error ingesting news:', error)
    return NextResponse.json(
      { error: 'Failed to ingest news' },
      { status: 500 }
    )
  }
}

