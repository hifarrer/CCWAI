import { NextRequest, NextResponse } from 'next/server'
import { ingestNewsFromRSS } from '@/lib/ingestion/news-rss'

/**
 * Public API endpoint for cron job to ingest RSS news feeds
 * Secured with a secret token passed in the Authorization header or as a query parameter
 * 
 * Usage with cron-job.org:
 * - URL: https://your-domain.com/api/cron/ingest-news
 * - Method: GET or POST
 * - Header: Authorization: Bearer YOUR_CRON_SECRET_TOKEN
 * - Or as query param: ?token=YOUR_CRON_SECRET_TOKEN
 */
export async function GET(request: NextRequest) {
  return handleRequest(request)
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
  try {
    // Get the secret token from environment variable
    const cronSecret = process.env.CRON_SECRET_TOKEN
    
    if (!cronSecret) {
      console.error('CRON_SECRET_TOKEN environment variable is not set')
      return NextResponse.json(
        { error: 'Cron job authentication not configured' },
        { status: 500 }
      )
    }

    // Check for token in Authorization header
    const authHeader = request.headers.get('authorization')
    let providedToken: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedToken = authHeader.substring(7)
    } else {
      // Check for token in query parameter (for cron-job.org compatibility)
      const searchParams = request.nextUrl.searchParams
      providedToken = searchParams.get('token')
    }

    // Validate token
    if (!providedToken || providedToken !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Execute the ingestion
    const startTime = Date.now()
    const result = await ingestNewsFromRSS()
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      ingested: result.ingested,
      errors: result.errors.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      message: `Successfully processed RSS feeds. Ingested ${result.ingested} new articles.`,
    })
  } catch (error) {
    console.error('Error in cron news ingestion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to ingest news',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

