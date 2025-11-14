'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface SupportPaymentProps {
  onSuccess?: () => void
}

export function SupportPayment({ onSuccess }: SupportPaymentProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const suggestedAmounts = [5, 25, 50, 500, 5000]

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
    setError('')
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value)
      setSelectedAmount(null)
      setError('')
    }
  }

  const handleSubmit = async () => {
    setError('')
    
    let amount: number
    if (customAmount) {
      amount = parseFloat(customAmount)
      if (isNaN(amount) || amount < 1) {
        setError('Please enter a valid amount (minimum $1)')
        return
      }
    } else if (selectedAmount) {
      amount = selectedAmount
    } else {
      setError('Please select an amount or enter a custom amount')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Checkout URL not received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Pay What You Want</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? 'default' : 'outline'}
                  onClick={() => handleAmountSelect(amount)}
                  className="h-12"
                  disabled={isProcessing}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
              Or enter a custom amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">$</span>
              <Input
                id="custom-amount"
                type="text"
                placeholder="0.00"
                value={customAmount}
                onChange={handleCustomAmountChange}
                disabled={isProcessing}
                className="flex-1"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || (!selectedAmount && !customAmount)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Continue to Payment'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Secure payment powered by Stripe
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

