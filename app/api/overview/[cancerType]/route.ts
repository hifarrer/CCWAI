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
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cancerType = decodeURIComponent(params.cancerType)
    const userId = session.user.id

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

    // Map cancer types to their keywords for title searching (used for both totalNews and approvals)
    const cancerTypeKeywords: Record<string, string[]> = {
      'breast': ['breast cancer', 'breast'],
      'lung': ['lung cancer', 'lung'],
      'colorectal': ['colorectal cancer', 'colorectal'],
      'prostate': ['prostate cancer', 'prostate'],
      'pancreatic': ['pancreatic cancer', 'pancreatic'],
      'liver': ['liver cancer', 'liver', 'hepatocellular'],
      'stomach': ['stomach cancer', 'stomach', 'gastric'],
      'esophageal': ['esophageal cancer', 'esophageal'],
      'bladder': ['bladder cancer', 'bladder'],
      'kidney': ['kidney cancer', 'kidney', 'renal'],
      'cervical': ['cervical cancer', 'cervical'],
      'ovarian': ['ovarian cancer', 'ovarian'],
      'leukemia': ['leukemia'],
      'lymphoma': ['lymphoma'],
      'melanoma': ['melanoma'],
      'brain': ['brain cancer', 'brain', 'glioma', 'glioblastoma'],
    }

    // Get keywords for this cancer type
    const keywords = cancerTypeKeywords[cancerType] || [cancerType]

    // Build OR conditions: check cancerTypes array OR search title for keywords
    const titleConditions = keywords.map(keyword => ({
      title: {
        contains: keyword,
        mode: 'insensitive' as const,
      },
    }))

    // Get FDA approvals for this cancer type (last 90 days)
    const approvals = await prisma.fdaApproval.count({
      where: {
        cancerTypes: { has: cancerType },
        approvalDate: {
          gte: getDaysAgo(90),
        },
      },
    })

    // Get total counts (all time, not just recent)
    const totalArticles = await prisma.researchPaper.count({
      where: {
        cancerTypes: { has: cancerType },
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
        ],
      },
    })

    const totalNews = await prisma.newsArticle.count({
      where: {
        OR: [
          {
            cancerTypes: { has: cancerType },
          },
          ...titleConditions,
        ],
      },
    })

    // Get user's matched trials count (preferred) or fall back to general count
    const userMatches = await prisma.userTrialMatch.findMany({
      where: { userId },
      select: { nctId: true },
    })

    let totalTrials: number
    if (userMatches.length > 0) {
      // Count all user's matched trials
      // These trials were already searched with the user's cancer type and criteria,
      // so we count them directly without requiring them to be in ClinicalTrial table
      totalTrials = userMatches.length
    } else {
      // Fall back to general count if user has no matches
      totalTrials = await prisma.clinicalTrial.count({
        where: {
          conditions: { has: cancerType },
          status: { in: ['RECRUITING', 'NOT_YET_RECRUITING', 'ENROLLING_BY_INVITATION'] },
        },
      })
    }

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
      totalArticles,
      totalNews,
      totalTrials,
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

