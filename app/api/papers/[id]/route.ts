import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paper = await prisma.researchPaper.findUnique({
      where: { id: params.id },
    })

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }

    return NextResponse.json({ paper })
  } catch (error) {
    console.error('Error fetching paper:', error)
    return NextResponse.json(
      { error: 'Failed to fetch paper' },
      { status: 500 }
    )
  }
}




