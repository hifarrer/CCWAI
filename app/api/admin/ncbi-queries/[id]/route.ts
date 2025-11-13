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
    const { query, name, description, isActive } = body

    const updateData: any = {}
    if (query !== undefined) {
      if (!query || query.trim() === '') {
        return NextResponse.json(
          { error: 'Query cannot be empty' },
          { status: 400 }
        )
      }
      updateData.query = query.trim()
    }
    if (name !== undefined) updateData.name = name || null
    if (description !== undefined) updateData.description = description || null
    if (isActive !== undefined) updateData.isActive = isActive

    const ncbiQuery = await prisma.ncbiQuery.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ query: ncbiQuery })
  } catch (error: any) {
    console.error('Error updating NCBI query:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'NCBI query not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update NCBI query' },
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

    await prisma.ncbiQuery.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting NCBI query:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'NCBI query not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete NCBI query' },
      { status: 500 }
    )
  }
}




