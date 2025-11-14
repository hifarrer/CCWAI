import { NextRequest, NextResponse } from 'next/server'
import { getStripeInstance } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount } = body

    if (!amount || typeof amount !== 'number' || amount < 1) {
      return NextResponse.json(
        { error: 'Valid amount is required (minimum $1)' },
        { status: 400 }
      )
    }

    // Convert dollars to cents
    const amountInCents = Math.round(amount * 100)

    // Get Stripe instance
    const stripe = await getStripeInstance()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Get base URL
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Create checkout session for one-time payment
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Support Our Project',
              description: 'Support our AI-powered cancer research platform',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'support',
        amount: amount.toString(),
      },
      success_url: `${origin}/donations?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donations?canceled=true`,
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })
  } catch (error: any) {
    console.error('Error creating support payment session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment session' },
      { status: 500 }
    )
  }
}

