import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { getDaysAgo } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { cancerType: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cancerType = decodeURIComponent(params.cancerType)

    // Get new trials in last 14 days
    const newTrials = await prisma.clinicalTrial.count({
      where: {
        conditions: { has: cancerType },
        status: { in: ['RECRUITING', 'NOT_YET_RECRUITING'] },
        updatedAt: {
          gte: getDaysAgo(14),
        },
      },
    })

    // Get recent papers in last 30 days (only with abstracts)
    const recentPapers = await prisma.researchPaper.count({
      where: {
        cancerTypes: { has: cancerType },
        publicationDate: {
          gte: getDaysAgo(30),
        },
        AND: [
          {
            abstract: {
              not: null,
            },
          },
          {
            abstract: {
              not: '',
            },
          },
          {
            NOT: {
              abstract: {
                contains: 'No abstract available',
                mode: 'insensitive',
              },
            },
          },
        ],
      },
    })

    // Get recent news articles mentioning approvals (simplified - in production would search news content)
    const approvals = await prisma.newsArticle.count({
      where: {
        cancerTypes: { has: cancerType },
        tags: { has: 'FDA' },
        publishedAt: {
          gte: getDaysAgo(90),
        },
      },
    })

    const trends = [
      {
        label: `${newTrials} new clinical trials`,
        value: `started recruiting in the last 14 days`,
      },
      {
        label: `${recentPapers} new research papers`,
        value: `published in the last 30 days`,
      },
    ]

    return NextResponse.json({
      newTrials,
      approvals,
      recentPapers,
      trends,
    })
  } catch (error) {
    console.error('Error fetching overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    )
  }
}

