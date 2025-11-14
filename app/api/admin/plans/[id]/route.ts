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
    
    // Check if user is authenticated and is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    )
  }
}

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
    const { name, features, monthlyPrice, yearlyPrice, monthlyStripePriceId, yearlyStripePriceId } = body

    if (!name || !features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Name and features array are required' },
        { status: 400 }
      )
    }

    if (monthlyPrice === undefined || yearlyPrice === undefined) {
      return NextResponse.json(
        { error: 'Monthly and yearly prices are required' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        name,
        features,
        monthlyPrice: parseFloat(monthlyPrice),
        yearlyPrice: parseFloat(yearlyPrice),
        monthlyStripePriceId: monthlyStripePriceId || null,
        yearlyStripePriceId: yearlyStripePriceId || null,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Failed to update plan' },
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

    // Check if plan has users
    const planWithUsers = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!planWithUsers) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (planWithUsers._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with existing users. Please reassign users first.' },
        { status: 400 }
      )
    }

    await prisma.subscriptionPlan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}

