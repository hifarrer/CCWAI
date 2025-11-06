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

    const feeds = await prisma.rssFeed.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ feeds })
  } catch (error) {
    console.error('Error fetching RSS feeds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds' },
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
    const { url, name, description, isActive } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const feed = await prisma.rssFeed.create({
      data: {
        url,
        name: name || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ feed })
  } catch (error: any) {
    console.error('Error creating RSS feed:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'RSS feed with this URL already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create RSS feed' },
      { status: 500 }
    )
  }
}

