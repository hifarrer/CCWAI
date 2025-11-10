import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { searchAndSaveTrialsForUser } from '@/lib/trials/user-matching'
import { TrialMatchCriteria } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        cancerType: true,
        zipCode: true,
        isInUSA: true,
        preferences: true,
        profileCompleted: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    const { age, cancerType, zipCode, isInUSA, preferences, profileCompleted } = body

    // Get user before update to check if this is a new profile completion
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, profileCompleted: true },
    })

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        age: age !== undefined ? age : undefined,
        cancerType,
        zipCode,
        isInUSA: isInUSA !== undefined ? isInUSA : undefined,
        preferences: preferences || {},
        profileCompleted: profileCompleted !== undefined ? profileCompleted : undefined,
      },
    })

    // If profile was just completed and we have the necessary info, trigger background trial search
    if (
      profileCompleted === true &&
      existingUser &&
      !existingUser.profileCompleted &&
      user.id &&
      user.cancerType &&
      (user.isInUSA === false || (user.isInUSA === true && user.zipCode))
    ) {
      // Build search criteria from user profile
      const criteria: TrialMatchCriteria = {
        cancerType: user.cancerType as any,
        age: user.age || undefined,
        zipCode: user.isInUSA ? user.zipCode || undefined : undefined,
        status: ['RECRUITING', 'NOT_YET_RECRUITING', 'ENROLLING_BY_INVITATION'],
      }

      // Trigger background search (don't await - let it run in background)
      searchAndSaveTrialsForUser(user.id, criteria).catch((error) => {
        console.error('[Profile] Error in background trial search:', error)
        // Don't fail the request if background search fails
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

