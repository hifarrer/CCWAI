import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { getDaysAgo } from '@/lib/utils'
import { CancerType } from '@/lib/types'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FdaApprovalsClient } from './FdaApprovalsClient'

interface PageProps {
  searchParams: {
    cancerType?: string
    page?: string
  }
}

export default async function FdaApprovalsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const limit = 50
  const page = parseInt(searchParams.page || '1')
  const offset = (page - 1) * limit

  // Build where clause
  const where: any = {}

  // Validate cancerType and filter if provided
  const validCancerTypes: CancerType[] = [
    'breast', 'lung', 'colorectal', 'prostate', 'pancreatic',
    'liver', 'stomach', 'esophageal', 'bladder', 'kidney',
    'cervical', 'ovarian', 'leukemia', 'lymphoma', 'melanoma',
    'brain', 'other',
  ]

  const cancerType: CancerType | undefined = searchParams.cancerType && 
    validCancerTypes.includes(searchParams.cancerType as CancerType)
    ? (searchParams.cancerType as CancerType)
    : undefined

  if (cancerType) {
    where.cancerTypes = {
      has: cancerType,
    }
  }

  // Only show approvals from the last 5 years
  const fiveYearsAgo = getDaysAgo(365 * 5)
  where.approvalDate = {
    gte: fiveYearsAgo,
  }

  // Fetch data in parallel
  const [approvals, total] = await Promise.all([
    prisma.fdaApproval.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        approvalDate: 'desc',
      },
    }),
    prisma.fdaApproval.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <FdaApprovalsClient
          initialApprovals={approvals}
          initialTotal={total}
          initialPage={page}
          initialTotalPages={totalPages}
          initialFilters={{
            cancerType,
          }}
        />
      </main>
      <Footer />
    </div>
  )
}

