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

    return NextResponse.json({
      totalUsers,
      totalCheckIns,
      totalChatSessions,
      activeUsersLast30Days,
      newUsersLast30Days,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

