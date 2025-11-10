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
import { Header } from '@/components/layout/Header'
import { SessionProvider } from '@/components/providers/SessionProvider'

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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    age: '',
    isInUSA: '',
    zipCode: '',
    cancerType: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        setFormData({
          age: user.age?.toString() || '',
          isInUSA: user.isInUSA === true ? 'yes' : user.isInUSA === false ? 'no' : '',
          zipCode: user.zipCode || '',
          cancerType: user.cancerType || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setFetching(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.age && (parseInt(formData.age) < 1 || parseInt(formData.age) > 120)) {
      newErrors.age = 'Please enter a valid age (1-120)'
    }

    if (formData.isInUSA === 'yes' && !formData.zipCode) {
      newErrors.zipCode = 'Please enter your zip code'
    } else if (formData.isInUSA === 'yes' && formData.zipCode) {
      const zipRegex = /^\d{5}(-\d{4})?$/
      if (!zipRegex.test(formData.zipCode)) {
        newErrors.zipCode = 'Please enter a valid US zip code (e.g., 12345 or 12345-6789)'
      }
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
    setSuccess(false)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: formData.age ? parseInt(formData.age) : null,
          isInUSA: formData.isInUSA === 'yes' ? true : formData.isInUSA === 'no' ? false : null,
          zipCode: formData.isInUSA === 'yes' ? formData.zipCode : null,
          cancerType: formData.cancerType || null,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('An error occurred while updating your profile')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || fetching) {
    return (
      <SessionProvider session={session}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="min-h-screen flex items-center justify-center">
            <div>Loading...</div>
          </div>
        </div>
      </SessionProvider>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">My Profile</CardTitle>
                <CardDescription>
                  Update your profile information. We only collect minimal information for HIPAA compliance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success && (
                  <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md text-sm">
                    Profile updated successfully!
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Enter your age"
                    />
                    {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Are you located in the USA?</Label>
                    <Select
                      value={formData.isInUSA}
                      onValueChange={(value) => {
                        setFormData({ ...formData, isInUSA: value, zipCode: value === 'no' ? '' : formData.zipCode })
                        setErrors({ ...errors, isInUSA: '', zipCode: '' })
                      }}
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
                      <Label htmlFor="zipCode">Zip Code</Label>
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
                    <Label>Cancer Type</Label>
                    <Select
                      value={formData.cancerType}
                      onValueChange={(value) => {
                        setFormData({ ...formData, cancerType: value })
                        setErrors({ ...errors, cancerType: '' })
                      }}
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

                  <div className="pt-4 border-t flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                    >
                      Cancel
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Your information is kept private and secure. We never share personal details.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}

