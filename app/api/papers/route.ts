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
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
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

    // Only filter by date if days parameter is provided
    if (days !== null) {
      where.publicationDate = {
        gte: getDaysAgo(days),
      }
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

    // Get total count for pagination
    const total = await prisma.researchPaper.count({ where })

    const papers = await prisma.researchPaper.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        publicationDate: 'desc',
      },
    })

    return NextResponse.json({
      papers,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching papers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    )
  }
}

