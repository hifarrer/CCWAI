import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total check-ins
    const totalCheckIns = await prisma.dailyCheckIn.count()

    // Get total chat sessions
    const totalChatSessions = await prisma.aiChatSession.count()

    // Get active users in last 30 days (users who have check-ins or chat sessions)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeUsersLast30Days = await prisma.user.count({
      where: {
        OR: [
          {
            dailyCheckins: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            aiChatSessions: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        ],
      },
    })

    // Get new users in last 30 days
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get research paper statistics
    const totalPapers = await prisma.researchPaper.count()

    // Get papers grouped by cancer type
    const allPapers = await prisma.researchPaper.findMany({
      select: {
        cancerTypes: true,
      },
    })

    // Count papers by cancer type (papers can have multiple cancer types)
    const cancerTypeCounts: Record<string, number> = {}
    allPapers.forEach((paper) => {
      if (paper.cancerTypes && paper.cancerTypes.length > 0) {
        paper.cancerTypes.forEach((cancerType) => {
          cancerTypeCounts[cancerType] = (cancerTypeCounts[cancerType] || 0) + 1
        })
      } else {
        // Papers with no cancer type
        cancerTypeCounts['other'] = (cancerTypeCounts['other'] || 0) + 1
      }
    })

    // Calculate total occurrences (may be > totalPapers since papers can have multiple types)
    const totalOccurrences = Object.values(cancerTypeCounts).reduce((sum, count) => sum + count, 0)

    // Convert to array format for easier frontend consumption
    // Percentage is based on total occurrences, not total papers (since papers can have multiple types)
    const cancerTypeStats = Object.entries(cancerTypeCounts)
      .map(([cancerType, count]) => ({
        cancerType,
        count,
        percentage: totalOccurrences > 0 ? Math.round((count / totalOccurrences) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending

    // Get FDA approvals statistics
    const totalFdaApprovals = await prisma.fdaApproval.count()

    // Get FDA approvals grouped by cancer type
    const allFdaApprovals = await prisma.fdaApproval.findMany({
      select: {
        cancerTypes: true,
      },
    })

    // Count FDA approvals by cancer type (approvals can have multiple cancer types)
    const fdaCancerTypeCounts: Record<string, number> = {}
    allFdaApprovals.forEach((approval) => {
      if (approval.cancerTypes && approval.cancerTypes.length > 0) {
        approval.cancerTypes.forEach((cancerType) => {
          fdaCancerTypeCounts[cancerType] = (fdaCancerTypeCounts[cancerType] || 0) + 1
        })
      } else {
        // Approvals with no cancer type
        fdaCancerTypeCounts['other'] = (fdaCancerTypeCounts['other'] || 0) + 1
      }
    })

    // Calculate total occurrences for FDA approvals
    const totalFdaOccurrences = Object.values(fdaCancerTypeCounts).reduce((sum, count) => sum + count, 0)

    // Convert to array format for easier frontend consumption
    const fdaCancerTypeStats = Object.entries(fdaCancerTypeCounts)
      .map(([cancerType, count]) => ({
        cancerType,
        count,
        percentage: totalFdaOccurrences > 0 ? Math.round((count / totalFdaOccurrences) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending

    return NextResponse.json({
      totalUsers,
      totalCheckIns,
      totalChatSessions,
      activeUsersLast30Days,
      newUsersLast30Days,
      totalPapers,
      cancerTypeStats,
      totalFdaApprovals,
      fdaCancerTypeStats,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

