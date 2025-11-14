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
    const serializedPlans = plans.map((plan) => ({
      ...plan,
      monthlyPrice: typeof plan.monthlyPrice === 'object' && 'toNumber' in plan.monthlyPrice
        ? plan.monthlyPrice.toNumber()
        : parseFloat(plan.monthlyPrice.toString()),
      yearlyPrice: typeof plan.yearlyPrice === 'object' && 'toNumber' in plan.yearlyPrice
        ? plan.yearlyPrice.toNumber()
        : parseFloat(plan.yearlyPrice.toString()),
    }))

    return NextResponse.json({ plans: serializedPlans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

