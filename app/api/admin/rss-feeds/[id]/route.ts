import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, name, description, isActive } = body

    const updateData: any = {}
    if (url !== undefined) {
      // Validate URL format if provided
      try {
        new URL(url)
        updateData.url = url
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }
    if (name !== undefined) updateData.name = name || null
    if (description !== undefined) updateData.description = description || null
    if (isActive !== undefined) updateData.isActive = isActive

    const feed = await prisma.rssFeed.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ feed })
  } catch (error: any) {
    console.error('Error updating RSS feed:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'RSS feed with this URL already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update RSS feed' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.rssFeed.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting RSS feed:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete RSS feed' },
      { status: 500 }
    )
  }
}

