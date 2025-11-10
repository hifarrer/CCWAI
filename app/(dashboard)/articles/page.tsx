import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { getDaysAgo } from '@/lib/utils'
import { ArticlesClient } from './ArticlesClient'

interface PageProps {
  searchParams: {
    cancerType?: string
    treatmentType?: string
    days?: string
    page?: string
  }
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const limit = 50
  const page = parseInt(searchParams.page || '1')
  const offset = (page - 1) * limit

  // Build where clause
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
  if (searchParams.days) {
    const days = parseInt(searchParams.days)
    where.publicationDate = {
      gte: getDaysAgo(days),
    }
  }

  if (searchParams.cancerType) {
    where.cancerTypes = {
      has: searchParams.cancerType,
    }
  }

  if (searchParams.treatmentType) {
    where.treatmentTypes = {
      has: searchParams.treatmentType,
    }
  }

  // Fetch data in parallel
  const [papers, total] = await Promise.all([
    prisma.researchPaper.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        publicationDate: 'desc',
      },
    }),
    prisma.researchPaper.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <ArticlesClient
      initialPapers={papers}
      initialTotal={total}
      initialPage={page}
      initialTotalPages={totalPages}
      initialFilters={{
        cancerType: searchParams.cancerType,
        treatmentType: searchParams.treatmentType,
        days: searchParams.days ? parseInt(searchParams.days) : undefined,
      }}
    />
  )
}
