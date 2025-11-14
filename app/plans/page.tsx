'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  features: string[]
  monthlyPrice: number | string | { toString(): string }
  yearlyPrice: number | string | { toString(): string }
}

export default function PlansPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | string | { toString(): string }) => {
    // Convert to number if it's a Decimal or string
    const numPrice = typeof price === 'number' ? price : parseFloat(price.toString())
    if (numPrice === 0 || isNaN(numPrice)) return 'Free'
    return `$${numPrice.toFixed(2)}`
  }

  const calculateYearlySavings = (
    monthlyPrice: number | string | { toString(): string },
    yearlyPrice: number | string | { toString(): string }
  ) => {
    // Convert to numbers
    const numMonthly = typeof monthlyPrice === 'number' ? monthlyPrice : parseFloat(monthlyPrice.toString())
    const numYearly = typeof yearlyPrice === 'number' ? yearlyPrice : parseFloat(yearlyPrice.toString())
    
    if (numMonthly === 0 || numYearly === 0 || isNaN(numMonthly) || isNaN(numYearly)) return null
    const monthlyTotal = numMonthly * 12
    const savings = monthlyTotal - numYearly
    if (savings > 0) {
      return Math.round((savings / monthlyTotal) * 100)
    }
    return null
  }

  const handleCheckout = async (planId: string, period: 'monthly' | 'yearly') => {
    // Check if user is logged in
    if (!session) {
      router.push('/login?redirect=/plans')
      return
    }

    setProcessing(planId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingPeriod: period,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to start checkout')
        return
      }

      // If it's a free plan, just redirect to dashboard
      if (data.success) {
        router.push('/dashboard')
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Checkout URL not received')
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Select the plan that best fits your needs
            </p>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm ${billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
                Yearly
                {billingPeriod === 'yearly' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    Save up to 20%
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No plans available at this time.</p>
            </div>
          ) : (
            <div className={`flex flex-wrap justify-center gap-8 ${
              plans.length === 1 ? 'max-w-md mx-auto' : 
              plans.length === 2 ? 'max-w-4xl mx-auto' : 
              'max-w-7xl mx-auto'
            }`}>
              {plans.map((plan) => {
                // Convert Decimal to number
                const monthlyPrice = typeof plan.monthlyPrice === 'number' 
                  ? plan.monthlyPrice 
                  : parseFloat(plan.monthlyPrice.toString())
                const yearlyPrice = typeof plan.yearlyPrice === 'number' 
                  ? plan.yearlyPrice 
                  : parseFloat(plan.yearlyPrice.toString())
                
                const price = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice
                const savings = calculateYearlySavings(monthlyPrice, yearlyPrice)
                const isFree = plan.name.toLowerCase() === 'free'
                const isPremium = plan.name.toLowerCase() === 'premium'

                return (
                  <Card
                    key={plan.id}
                    className={`relative w-full sm:w-auto ${
                      plans.length <= 2 ? 'sm:max-w-sm' : 'sm:max-w-xs'
                    } ${
                      isPremium
                        ? 'border-primary border-2 shadow-lg sm:scale-105'
                        : 'border-gray-200'
                    }`}
                  >
                    {isPremium && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <div className="text-4xl font-bold">
                          {formatPrice(price)}
                        </div>
                        {price > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            per {billingPeriod === 'monthly' ? 'month' : 'year'}
                          </div>
                        )}
                        {billingPeriod === 'yearly' && savings && (
                          <div className="text-sm text-green-600 font-semibold mt-2">
                            Save {savings}% vs monthly
                          </div>
                        )}
                        {billingPeriod === 'monthly' && yearlyPrice > 0 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            ${yearlyPrice.toFixed(2)}/year if paid annually
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isPremium ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => handleCheckout(plan.id, billingPeriod)}
                        disabled={isFree || processing === plan.id}
                      >
                        {processing === plan.id 
                          ? 'Processing...' 
                          : isFree 
                            ? 'Current Plan' 
                            : 'Get Started'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include secure access to your personalized dashboard.
              <br />
              Payment processing will be available soon.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

