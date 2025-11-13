import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { treatmentName: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const treatmentName = decodeURIComponent(params.treatmentName)

    const sideEffects = await prisma.treatmentSideEffect.findMany({
      where: {
        treatmentName: {
          contains: treatmentName,
          mode: 'insensitive',
        },
      },
      orderBy: [
        { severity: 'asc' },
        { sideEffectName: 'asc' },
      ],
    })

    return NextResponse.json({ sideEffects })
  } catch (error) {
    console.error('Error fetching side effects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch side effects' },
      { status: 500 }
    )
  }
}




