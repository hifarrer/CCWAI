import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

/**
 * GET /api/user/alerts/notifications
 * Get unread alerts for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get unread alerts (where readAt is null)
    const unreadAlerts = await prisma.userEmailAlert.findMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    })

    // Group alerts by type and fetch the actual article/paper data
    const alertsWithData = await Promise.all(
      unreadAlerts.map(async (alert) => {
        let article = null
        let url = null

        if (alert.recordType === 'ResearchPaper') {
          const paper = await prisma.researchPaper.findUnique({
            where: { id: alert.recordId },
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
          if (paper) {
            article = {
              id: paper.id,
              title: paper.title,
              summary: paper.abstract,
              source: paper.journal,
              publishedAt: paper.publicationDate,
              authors: paper.authors,
              cancerTypes: paper.cancerTypes,
            }
            url = paper.fullTextUrl
          }
        } else if (alert.recordType === 'NewsArticle') {
          const news = await prisma.newsArticle.findUnique({
            where: { id: alert.recordId },
            select: {
              id: true,
              title: true,
              summary: true,
              source: true,
              publishedAt: true,
              cancerTypes: true,
              url: true,
            },
          })
          if (news) {
            article = {
              id: news.id,
              title: news.title,
              summary: news.summary,
              source: news.source,
              publishedAt: news.publishedAt,
              cancerTypes: news.cancerTypes,
            }
            url = news.url
          }
        }

        return {
          id: alert.id,
          alertType: alert.alertType,
          recordId: alert.recordId,
          recordType: alert.recordType,
          sentAt: alert.sentAt,
          article,
          url,
        }
      })
    )

    // Filter out alerts where article was not found (might have been deleted)
    const validAlerts = alertsWithData.filter((alert) => alert.article !== null)

    return NextResponse.json({
      alerts: validAlerts,
      count: validAlerts.length,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/alerts/notifications
 * Mark alerts as read
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { alertIds } = body

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        { error: 'alertIds array is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mark alerts as read
    const result = await prisma.userEmailAlert.updateMany({
      where: {
        id: {
          in: alertIds,
        },
        userId: user.id,
        readAt: null, // Only update unread alerts
      },
      data: {
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      updated: result.count,
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}

