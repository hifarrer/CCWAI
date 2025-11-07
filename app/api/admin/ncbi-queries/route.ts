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

    const queries = await prisma.ncbiQuery.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ queries })
  } catch (error) {
    console.error('Error fetching NCBI queries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NCBI queries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, name, description, isActive } = body

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const ncbiQuery = await prisma.ncbiQuery.create({
      data: {
        query: query.trim(),
        name: name || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ query: ncbiQuery })
  } catch (error: any) {
    console.error('Error creating NCBI query:', error)
    return NextResponse.json(
      { error: 'Failed to create NCBI query' },
      { status: 500 }
    )
  }
}

