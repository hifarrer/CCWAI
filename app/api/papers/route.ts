import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { getDaysAgo } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const cancerType = searchParams.get('cancerType')
    const treatmentType = searchParams.get('treatmentType')
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      publicationDate: {
        gte: getDaysAgo(days),
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
    }

    if (cancerType) {
      where.cancerTypes = {
        has: cancerType,
      }
    }

    if (treatmentType) {
      where.treatmentTypes = {
        has: treatmentType,
      }
    }

    const papers = await prisma.researchPaper.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        publicationDate: 'desc',
      },
    })

    return NextResponse.json({ papers })
  } catch (error) {
    console.error('Error fetching papers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    )
  }
}

