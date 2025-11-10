'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CANCER_TYPES = [
  { value: 'breast', label: 'Breast Cancer' },
  { value: 'lung', label: 'Lung Cancer' },
  { value: 'colorectal', label: 'Colorectal Cancer' },
  { value: 'prostate', label: 'Prostate Cancer' },
  { value: 'pancreatic', label: 'Pancreatic Cancer' },
  { value: 'liver', label: 'Liver Cancer' },
  { value: 'stomach', label: 'Stomach Cancer' },
  { value: 'esophageal', label: 'Esophageal Cancer' },
  { value: 'bladder', label: 'Bladder Cancer' },
  { value: 'kidney', label: 'Kidney Cancer' },
  { value: 'cervical', label: 'Cervical Cancer' },
  { value: 'ovarian', label: 'Ovarian Cancer' },
  { value: 'leukemia', label: 'Leukemia' },
  { value: 'lymphoma', label: 'Lymphoma' },
  { value: 'melanoma', label: 'Melanoma' },
  { value: 'brain', label: 'Brain Cancer' },
  { value: 'other', label: 'Other' },
]

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    age: '',
    isInUSA: '',
    zipCode: '',
    cancerType: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role === 'admin') {
      // Admin users don't need to complete onboarding
      router.push('/dashboard')
    }
  }, [status, router, session])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age (1-120)'
    }

    if (!formData.isInUSA) {
      newErrors.isInUSA = 'Please select whether you are in the USA'
    }

    if (formData.isInUSA === 'yes' && !formData.zipCode) {
      newErrors.zipCode = 'Please enter your zip code'
    } else if (formData.isInUSA === 'yes' && formData.zipCode) {
      // Basic zip code validation (5 digits or 5+4 format)
      const zipRegex = /^\d{5}(-\d{4})?$/
      if (!zipRegex.test(formData.zipCode)) {
        newErrors.zipCode = 'Please enter a valid US zip code (e.g., 12345 or 12345-6789)'
      }
    }

    if (!formData.cancerType) {
      newErrors.cancerType = 'Please select your cancer type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          isInUSA: formData.isInUSA === 'yes',
          zipCode: formData.isInUSA === 'yes' ? formData.zipCode : null,
          cancerType: formData.cancerType,
          profileCompleted: true,
        }),
      })

      if (response.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('An error occurred while saving your profile')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Help us personalize your experience. We only collect minimal information for HIPAA compliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">
                Age <span className="text-red-500">*</span>
              </Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter your age"
                required
              />
              {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>
                Are you located in the USA? <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.isInUSA}
                onValueChange={(value) => {
                  setFormData({ ...formData, isInUSA: value, zipCode: '' })
                  setErrors({ ...errors, isInUSA: '', zipCode: '' })
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.isInUSA && <p className="text-sm text-red-500">{errors.isInUSA}</p>}
            </div>

            {/* Zip Code (only if in USA) */}
            {formData.isInUSA === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="zipCode">
                  Zip Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="12345 or 12345-6789"
                  maxLength={10}
                />
                {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode}</p>}
                <p className="text-xs text-muted-foreground">
                  We only need your zip code to find nearby clinical trials. No other location data is stored.
                </p>
              </div>
            )}

            {/* Cancer Type */}
            <div className="space-y-2">
              <Label>
                Cancer Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.cancerType}
                onValueChange={(value) => {
                  setFormData({ ...formData, cancerType: value })
                  setErrors({ ...errors, cancerType: '' })
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your cancer type" />
                </SelectTrigger>
                <SelectContent>
                  {CANCER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cancerType && <p className="text-sm text-red-500">{errors.cancerType}</p>}
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your information is kept private and secure. We never share personal details.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

