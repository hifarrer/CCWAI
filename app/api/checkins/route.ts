import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { DailyCheckInInput } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      userId: session.user.id,
    }

    if (startDate || endDate) {
      where.checkInDate = {}
      if (startDate) where.checkInDate.gte = new Date(startDate)
      if (endDate) where.checkInDate.lte = new Date(endDate)
    }

    const checkIns = await prisma.dailyCheckIn.findMany({
      where,
      orderBy: {
        checkInDate: 'desc',
      },
    })

    return NextResponse.json({ checkIns })
  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: DailyCheckInInput = await request.json()
    const { date, symptoms, notes } = body

    const checkIn = await prisma.dailyCheckIn.upsert({
      where: {
        userId_checkInDate: {
          userId: session.user.id,
          checkInDate: new Date(date),
        },
      },
      update: {
        symptoms,
        notes,
      },
      create: {
        userId: session.user.id,
        checkInDate: new Date(date),
        symptoms,
        notes,
      },
    })

    return NextResponse.json({ checkIn })
  } catch (error) {
    console.error('Error creating check-in:', error)
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    )
  }
}

