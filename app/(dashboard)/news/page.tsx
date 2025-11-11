import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NewsClient } from './NewsClient'

interface PageProps {
  searchParams: {
    cancerType?: string
    search?: string
    page?: string
  }
}

export default async function NewsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const limit = 50
  const page = parseInt(searchParams.page || '1')
  const offset = (page - 1) * limit

  // Build where clause
  const where: any = {}

  // First, try to get news for the specific cancer type
  if (searchParams.cancerType) {
    where.cancerTypes = {
      has: searchParams.cancerType,
    }
  }

  // Add keyword search in title and content
  if (searchParams.search) {
    where.OR = [
      {
        title: {
          contains: searchParams.search,
          mode: 'insensitive',
        },
      },
      {
        content: {
          contains: searchParams.search,
          mode: 'insensitive',
        },
      },
      {
        summary: {
          contains: searchParams.search,
          mode: 'insensitive',
        },
      },
    ]
  }

  // Fetch data in parallel
  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        publishedAt: 'desc',
      },
    }),
    prisma.newsArticle.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Check if we need to show fallback message
  let showFallbackMessage = false
  let fallbackArticles: typeof articles = []
  let fallbackTotal = 0
  let fallbackTotalPages = 0

  // If filtering by cancer type and no results, fetch all cancer-related news
  if (searchParams.cancerType && articles.length === 0 && !searchParams.search) {
    showFallbackMessage = true
    
    const fallbackWhere: any = {
      OR: [
        { cancerTypes: { isEmpty: false } }, // Has any cancer types
        {
          OR: [
            { title: { contains: 'cancer', mode: 'insensitive' } },
            { content: { contains: 'cancer', mode: 'insensitive' } },
            { summary: { contains: 'cancer', mode: 'insensitive' } },
          ],
        },
      ],
    }

    const [fallbackData, fallbackCount] = await Promise.all([
      prisma.newsArticle.findMany({
        where: fallbackWhere,
        take: limit,
        skip: offset,
        orderBy: {
          publishedAt: 'desc',
        },
      }),
      prisma.newsArticle.count({ where: fallbackWhere }),
    ])

    fallbackArticles = fallbackData
    fallbackTotal = fallbackCount
    fallbackTotalPages = Math.ceil(fallbackTotal / limit)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <NewsClient
          initialArticles={showFallbackMessage ? fallbackArticles : articles}
          initialTotal={showFallbackMessage ? fallbackTotal : total}
          initialPage={page}
          initialTotalPages={showFallbackMessage ? fallbackTotalPages : totalPages}
          initialFilters={{
            cancerType: searchParams.cancerType,
            search: searchParams.search,
          }}
          showFallbackMessage={showFallbackMessage}
          userCancerType={searchParams.cancerType}
        />
      </main>
      <Footer />
    </div>
  )
}

