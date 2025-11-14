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

    // Get or create Stripe settings (singleton record)
    let settings = await prisma.stripeSettings.findUnique({
      where: { id: 'stripe-settings' },
    })

    // If settings don't exist, create them
    if (!settings) {
      settings = await prisma.stripeSettings.create({
        data: {
          id: 'stripe-settings',
        },
      })
    }

    // Return settings (mask secret key for security - only show last 4 characters)
    const maskedSecretKey = settings.secretKey
      ? `••••${settings.secretKey.slice(-4)}`
      : null

    return NextResponse.json({
      settings: {
        ...settings,
        secretKey: maskedSecretKey, // Only return masked version
        rawSecretKey: settings.secretKey, // Include raw for editing (admin only)
      },
    })
  } catch (error) {
    console.error('Error fetching Stripe settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Stripe settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { publishableKey, secretKey, webhookSecret } = body

    // Get or create settings
    let settings = await prisma.stripeSettings.findUnique({
      where: { id: 'stripe-settings' },
    })

    // Convert empty strings to null
    const cleanPublishableKey = publishableKey === '' ? null : (publishableKey || null)
    const cleanSecretKey = secretKey === '' ? null : (secretKey || null)
    const cleanWebhookSecret = webhookSecret === '' ? null : (webhookSecret || null)

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.stripeSettings.create({
        data: {
          id: 'stripe-settings',
          publishableKey: cleanPublishableKey,
          secretKey: cleanSecretKey,
          webhookSecret: cleanWebhookSecret,
        },
      })
    } else {
      // Update existing
      settings = await prisma.stripeSettings.update({
        where: { id: 'stripe-settings' },
        data: {
          publishableKey: publishableKey !== undefined ? cleanPublishableKey : settings.publishableKey,
          secretKey: secretKey !== undefined ? cleanSecretKey : settings.secretKey,
          webhookSecret: webhookSecret !== undefined ? cleanWebhookSecret : settings.webhookSecret,
        },
      })
    }

    // Return updated settings (mask secret key)
    const maskedSecretKey = settings.secretKey
      ? `••••${settings.secretKey.slice(-4)}`
      : null

    return NextResponse.json({
      settings: {
        ...settings,
        secretKey: maskedSecretKey,
        rawSecretKey: settings.secretKey,
      },
    })
  } catch (error) {
    console.error('Error updating Stripe settings:', error)
    return NextResponse.json(
      { error: 'Failed to update Stripe settings' },
      { status: 500 }
    )
  }
}

