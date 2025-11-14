import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication required
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        monthlyPrice: 'asc',
      },
      select: {
        id: true,
        name: true,
        features: true,
        monthlyPrice: true,
        yearlyPrice: true,
        // Don't expose Stripe price IDs publicly
      },
    })

    // Convert Decimal to number for JSON serialization
    const serializedPlans = plans.map((plan) => {
      const monthlyPrice = typeof plan.monthlyPrice === 'object' && plan.monthlyPrice !== null && 'toNumber' in plan.monthlyPrice
        ? (plan.monthlyPrice as any).toNumber()
        : typeof plan.monthlyPrice === 'number'
        ? plan.monthlyPrice
        : parseFloat(String(plan.monthlyPrice))
      
      const yearlyPrice = typeof plan.yearlyPrice === 'object' && plan.yearlyPrice !== null && 'toNumber' in plan.yearlyPrice
        ? (plan.yearlyPrice as any).toNumber()
        : typeof plan.yearlyPrice === 'number'
        ? plan.yearlyPrice
        : parseFloat(String(plan.yearlyPrice))

      return {
        ...plan,
        monthlyPrice,
        yearlyPrice,
      }
    })

    return NextResponse.json({ plans: serializedPlans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

