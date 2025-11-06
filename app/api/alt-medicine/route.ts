import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const cancerType = searchParams.get('cancerType')

    const where: any = {}
    if (cancerType) {
      where.cancerTypes = {
        has: cancerType,
      }
    }

    const articles = await prisma.altMedicineResearch.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        publishedAt: 'desc',
      },
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Error fetching alt medicine:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alternative medicine research' },
      { status: 500 }
    )
  }
}

