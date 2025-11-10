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

    const searchParams = request.nextUrl.searchParams
    const cancerType = searchParams.get('cancerType')
    const treatmentType = searchParams.get('treatmentType')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    // Filter by cancer type
    if (cancerType && cancerType !== 'all') {
      where.cancerTypes = {
        has: cancerType,
      }
    }

    // Filter by treatment type
    if (treatmentType && treatmentType !== 'all') {
      where.treatmentTypes = {
        has: treatmentType,
      }
    }

    // Search by title or abstract
    if (search && search.trim()) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          abstract: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Get total count for pagination
    const total = await prisma.researchPaper.count({ where })

    // Get papers with pagination, ordered by publication date descending
    const papers = await prisma.researchPaper.findMany({
      where,
      take: limit,
      skip,
      orderBy: {
        publicationDate: 'desc',
      },
      select: {
        id: true,
        pubmedId: true,
        title: true,
        abstract: true,
        authors: true,
        journal: true,
        publicationDate: true,
        cancerTypes: true,
        treatmentTypes: true,
        keywords: true,
        fullTextUrl: true,
        summaryPlain: true,
        summaryClinical: true,
        ingestedAt: true,
      },
    })

    return NextResponse.json({
      papers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

