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
    const category = searchParams.get('category')
    const cancerType = searchParams.get('cancerType')
    const zipCode = searchParams.get('zipCode')

    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (cancerType) {
      where.cancerTypes = {
        has: cancerType,
      }
    }

    // Note: Region filtering by zip code would require additional logic
    // For now, just return all matching resources

    const resources = await prisma.supportResource.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching support resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support resources' },
      { status: 500 }
    )
  }
}

