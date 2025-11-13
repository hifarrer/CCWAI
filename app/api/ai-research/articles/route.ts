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
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch latest news articles
    const newsArticles = await prisma.newsArticle.findMany({
      take: limit,
      orderBy: {
        publishedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        source: true,
        publishedAt: true,
        cancerTypes: true,
        summary: true,
      },
    })

    // Fetch latest research papers
    const researchPapers = await prisma.researchPaper.findMany({
      take: limit,
      where: {
        abstract: {
          not: null,
        },
      },
      orderBy: {
        publicationDate: 'desc',
      },
      select: {
        id: true,
        pubmedId: true,
        title: true,
        journal: true,
        publicationDate: true,
        cancerTypes: true,
        treatmentTypes: true,
        authors: true,
      },
    })

    return NextResponse.json({
      newsArticles,
      researchPapers,
    })
  } catch (error) {
    console.error('Error fetching articles for AI research:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}




