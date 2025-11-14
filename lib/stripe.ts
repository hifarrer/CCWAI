import Stripe from 'stripe'
import { prisma } from './db/client'

let stripeInstance: Stripe | null = null

export async function getStripeInstance(): Promise<Stripe | null> {
  if (stripeInstance) {
    return stripeInstance
  }

  // Get Stripe settings from database
  const settings = await prisma.stripeSettings.findUnique({
    where: { id: 'stripe-settings' },
  })

  if (!settings || !settings.secretKey) {
    console.error('Stripe secret key not configured')
    return null
  }

  stripeInstance = new Stripe(settings.secretKey, {
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  })

  return stripeInstance
}

export async function getStripePublishableKey(): Promise<string | null> {
  const settings = await prisma.stripeSettings.findUnique({
    where: { id: 'stripe-settings' },
  })

  return settings?.publishableKey || null
}

