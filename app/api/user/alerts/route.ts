import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        preferences: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const alertPreferences = (user.preferences as any)?.alerts || {
      clinicalTrials: 'all',
      researchArticles: 'all',
      news: 'all',
      aiInsights: 'all',
      potentialCures: 'all',
    }

    return NextResponse.json({ preferences: alertPreferences })
  } catch (error) {
    console.error('Error fetching alert preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alert preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      )
    }

    // Validate preference values
    const validScopes = ['all', 'myType', 'none']
    const validKeys = ['clinicalTrials', 'researchArticles', 'news', 'aiInsights', 'potentialCures']
    
    for (const key of validKeys) {
      if (preferences[key] && !validScopes.includes(preferences[key])) {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        )
      }
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { preferences: true },
    })

    const currentPreferences = (user?.preferences as any) || {}
    
    // Merge alert preferences with existing preferences
    const updatedPreferences = {
      ...currentPreferences,
      alerts: {
        clinicalTrials: preferences.clinicalTrials || currentPreferences.alerts?.clinicalTrials || 'all',
        researchArticles: preferences.researchArticles || currentPreferences.alerts?.researchArticles || 'all',
        news: preferences.news || currentPreferences.alerts?.news || 'all',
        aiInsights: preferences.aiInsights || currentPreferences.alerts?.aiInsights || 'all',
        potentialCures: preferences.potentialCures || currentPreferences.alerts?.potentialCures || 'all',
      },
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        preferences: updatedPreferences,
      },
    })

    return NextResponse.json({ 
      success: true,
      preferences: updatedPreferences.alerts 
    })
  } catch (error) {
    console.error('Error saving alert preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save alert preferences' },
      { status: 500 }
    )
  }
}

