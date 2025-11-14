import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { sendAlertEmail } from '@/lib/email/alerts'

/**
 * Public API endpoint for cron job to send email alerts to users
 * Secured with a secret token passed in the Authorization header or as a query parameter
 * 
 * Usage with cron-job.org:
 * - URL: https://your-domain.com/api/cron/send-alerts
 * - Method: GET or POST
 * - Header: Authorization: Bearer YOUR_CRON_SECRET_TOKEN
 * - Or as query param: ?token=YOUR_CRON_SECRET_TOKEN
 * 
 * Test mode:
 * - Add ?test=1 to send test email to RESEND_TO_EMAIL
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

    // Validate token (skip in test mode)
    const isTestMode = request.nextUrl.searchParams.get('test') === '1'
    if (!isTestMode && (!providedToken || providedToken !== cronSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    const results = await processAlerts(isTestMode)
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      testMode: isTestMode,
      ...results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cron alert sending:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function processAlerts(isTestMode: boolean) {
  const stats = {
    usersProcessed: 0,
    emailsSent: 0,
    researchArticlesSent: 0,
    newsSent: 0,
    errors: [] as string[],
  }

  try {
    // Get all users with email addresses
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        cancerType: true,
        preferences: true,
      },
    })

    if (isTestMode) {
      // In test mode, send to RESEND_TO_EMAIL
      const testEmail = process.env.RESEND_TO_EMAIL
      if (!testEmail) {
        throw new Error('RESEND_TO_EMAIL is not configured for test mode')
      }

      // Send test emails for each alert type
      const testArticles = [
        {
          id: 'test-1',
          title: 'Test Research Article: Breakthrough in Cancer Treatment',
          publishedAt: new Date(),
          journal: 'Nature Medicine',
          authors: ['Dr. Jane Smith', 'Dr. John Doe'],
          cancerTypes: ['breast'],
          abstract: 'This is a test research article to verify the email alert system is working correctly.',
        },
        {
          id: 'test-2',
          title: 'Test News: New Cancer Drug Approved by FDA',
          publishedAt: new Date(),
          source: 'Medical News Today',
          summary: 'This is a test news article to verify the email alert system is working correctly.',
          cancerTypes: ['lung'],
        },
      ]

      const alertTypes: Array<'researchArticles' | 'news'> = ['researchArticles', 'news']
      
      for (const alertType of alertTypes) {
        const result = await sendAlertEmail(
          'test-user-id',
          testEmail,
          {
            articles: alertType === 'researchArticles' ? [testArticles[0]] : [testArticles[1]],
            alertType,
            userName: 'Test User',
            cancerType: 'breast',
          },
          true // Skip record creation in test mode
        )

        if (result.success) {
          stats.emailsSent++
          if (alertType === 'researchArticles') {
            stats.researchArticlesSent++
          } else {
            stats.newsSent++
          }
        } else {
          stats.errors.push(`Test ${alertType}: ${result.error}`)
        }
      }

      return {
        ...stats,
        testEmail,
        message: `Test emails sent to ${testEmail}`,
      }
    }

    // Get the date 24 hours ago
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Process each user
    for (const user of users) {
      if (!user.email) continue

      stats.usersProcessed++

      const preferences = (user.preferences as any)?.alerts || {
        clinicalTrials: 'all',
        researchArticles: 'all',
        news: 'all',
        aiInsights: 'all',
        potentialCures: 'all',
      }

      // Process Research Articles
      if (preferences.researchArticles && preferences.researchArticles !== 'none') {
        const articles = await getNewResearchArticles(
          user.id,
          'researchArticles',
          preferences.researchArticles === 'myType' ? user.cancerType : null,
          yesterday
        )

        if (articles.length > 0) {
          const result = await sendAlertEmail(user.id, user.email, {
            articles,
            alertType: 'researchArticles',
            userName: user.name,
            cancerType: user.cancerType || undefined,
          })

          if (result.success) {
            stats.emailsSent++
            stats.researchArticlesSent += articles.length
          } else {
            stats.errors.push(`User ${user.id} researchArticles: ${result.error}`)
          }
        }
      }

      // Process News Articles
      if (preferences.news && preferences.news !== 'none') {
        const articles = await getNewNewsArticles(
          user.id,
          'news',
          preferences.news === 'myType' ? user.cancerType : null,
          yesterday
        )

        if (articles.length > 0) {
          const result = await sendAlertEmail(user.id, user.email, {
            articles,
            alertType: 'news',
            userName: user.name,
            cancerType: user.cancerType || undefined,
          })

          if (result.success) {
            stats.emailsSent++
            stats.newsSent += articles.length
          } else {
            stats.errors.push(`User ${user.id} news: ${result.error}`)
          }
        }
      }

      // Process Potential Cures (research articles with specific keywords)
      if (preferences.potentialCures && preferences.potentialCures !== 'none') {
        const articles = await getNewPotentialCures(
          user.id,
          preferences.potentialCures === 'myType' ? user.cancerType : null,
          yesterday
        )

        if (articles.length > 0) {
          const result = await sendAlertEmail(user.id, user.email, {
            articles,
            alertType: 'potentialCures',
            userName: user.name,
            cancerType: user.cancerType || undefined,
          })

          if (result.success) {
            stats.emailsSent++
            stats.researchArticlesSent += articles.length
          } else {
            stats.errors.push(`User ${user.id} potentialCures: ${result.error}`)
          }
        }
      }
    }

    return {
      ...stats,
      message: `Processed ${stats.usersProcessed} users, sent ${stats.emailsSent} emails`,
    }
  } catch (error) {
    console.error('Error processing alerts:', error)
    stats.errors.push(error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

async function getNewResearchArticles(
  userId: string,
  alertType: string,
  cancerType: string | null,
  sinceDate: Date
) {
  // Get already sent article IDs
  const sentAlerts = await prisma.userEmailAlert.findMany({
    where: {
      userId,
      alertType,
    },
    select: {
      recordId: true,
    },
  })

  const sentIds = new Set(sentAlerts.map((a) => a.recordId))

  // Build where clause
  const where: any = {
    ingestedAt: {
      gte: sinceDate,
    },
    abstract: {
      not: null,
    },
  }

  // Only exclude sent IDs if there are any
  if (sentIds.size > 0) {
    where.NOT = {
      id: {
        in: Array.from(sentIds),
      },
    }
  }

  if (cancerType) {
    where.cancerTypes = {
      has: cancerType,
    }
  }

  const papers = await prisma.researchPaper.findMany({
    where,
    take: 20, // Limit to 20 per email
    orderBy: {
      publicationDate: 'desc',
    },
    select: {
      id: true,
      title: true,
      abstract: true,
      journal: true,
      publicationDate: true,
      authors: true,
      cancerTypes: true,
      fullTextUrl: true,
    },
  })

  return papers.map((paper) => ({
    id: paper.id,
    title: paper.title,
    url: paper.fullTextUrl || undefined,
    publishedAt: paper.publicationDate,
    journal: paper.journal || undefined,
    authors: paper.authors,
    abstract: paper.abstract || undefined,
    cancerTypes: paper.cancerTypes,
  }))
}

async function getNewNewsArticles(
  userId: string,
  alertType: string,
  cancerType: string | null,
  sinceDate: Date
) {
  // Get already sent article IDs
  const sentAlerts = await prisma.userEmailAlert.findMany({
    where: {
      userId,
      alertType,
    },
    select: {
      recordId: true,
    },
  })

  const sentIds = new Set(sentAlerts.map((a) => a.recordId))

  // Build where clause
  const where: any = {
    ingestedAt: {
      gte: sinceDate,
    },
  }

  // Only exclude sent IDs if there are any
  if (sentIds.size > 0) {
    where.NOT = {
      id: {
        in: Array.from(sentIds),
      },
    }
  }

  if (cancerType) {
    where.cancerTypes = {
      has: cancerType,
    }
  }

  const articles = await prisma.newsArticle.findMany({
    where,
    take: 20, // Limit to 20 per email
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      summary: true,
      source: true,
      url: true,
      publishedAt: true,
      cancerTypes: true,
    },
  })

  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    url: article.url || undefined,
    publishedAt: article.publishedAt,
    source: article.source || undefined,
    summary: article.summary || undefined,
    cancerTypes: article.cancerTypes,
  }))
}

async function getNewPotentialCures(
  userId: string,
  cancerType: string | null,
  sinceDate: Date
) {
  // Get already sent article IDs
  const sentAlerts = await prisma.userEmailAlert.findMany({
    where: {
      userId,
      alertType: 'potentialCures',
    },
    select: {
      recordId: true,
    },
  })

  const sentIds = new Set(sentAlerts.map((a) => a.recordId))

  // Build where clause - look for keywords related to cures
  const cureKeywords = ['cure', 'remission', 'eradication', 'elimination', 'complete response', 'curative']
  
  // Build OR conditions for each keyword
  const orConditions: any[] = []
  for (const keyword of cureKeywords) {
    orConditions.push(
      {
        title: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      {
        abstract: {
          contains: keyword,
          mode: 'insensitive',
        },
      }
    )
  }
  orConditions.push({
    keywords: {
      hasSome: cureKeywords,
    },
  })

  const where: any = {
    ingestedAt: {
      gte: sinceDate,
    },
    abstract: {
      not: null,
    },
    OR: orConditions,
  }

  // Only exclude sent IDs if there are any
  if (sentIds.size > 0) {
    where.NOT = {
      id: {
        in: Array.from(sentIds),
      },
    }
  }

  if (cancerType) {
    where.cancerTypes = {
      has: cancerType,
    }
  }

  const papers = await prisma.researchPaper.findMany({
    where,
    take: 20, // Limit to 20 per email
    orderBy: {
      publicationDate: 'desc',
    },
    select: {
      id: true,
      title: true,
      abstract: true,
      journal: true,
      publicationDate: true,
      authors: true,
      cancerTypes: true,
      fullTextUrl: true,
    },
  })

  return papers.map((paper) => ({
    id: paper.id,
    title: paper.title,
    url: paper.fullTextUrl || undefined,
    publishedAt: paper.publicationDate,
    journal: paper.journal || undefined,
    authors: paper.authors,
    abstract: paper.abstract || undefined,
    cancerTypes: paper.cancerTypes,
  }))
}

