'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface SubscriptionPlan {
  id: string
  name: string
  features: string[]
  monthlyPrice: number
  yearlyPrice: number
  monthlyStripePriceId: string | null
  yearlyStripePriceId: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
  }
}

export default function PlansPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [planForm, setPlanForm] = useState({
    name: '',
    features: [''],
    monthlyPrice: '',
    yearlyPrice: '',
    monthlyStripePriceId: '',
    yearlyStripePriceId: '',
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchPlans()
    }
  }, [session, status])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleAddFeature = () => {
    setPlanForm({
      ...planForm,
      features: [...planForm.features, ''],
    })
  }

  const handleRemoveFeature = (index: number) => {
    setPlanForm({
      ...planForm,
      features: planForm.features.filter((_, i) => i !== index),
    })
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...planForm.features]
    newFeatures[index] = value
    setPlanForm({
      ...planForm,
      features: newFeatures,
    })
  }

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const features = planForm.features.filter((f) => f.trim() !== '')
      if (features.length === 0) {
        alert('Please add at least one feature')
        return
      }

      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          features,
          monthlyPrice: parseFloat(planForm.monthlyPrice),
          yearlyPrice: parseFloat(planForm.yearlyPrice),
          monthlyStripePriceId: planForm.monthlyStripePriceId || null,
          yearlyStripePriceId: planForm.yearlyStripePriceId || null,
        }),
      })
      if (res.ok) {
        setPlanForm({
          name: '',
          features: [''],
          monthlyPrice: '',
          yearlyPrice: '',
          monthlyStripePriceId: '',
          yearlyStripePriceId: '',
        })
        setShowAddPlan(false)
        fetchPlans()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add plan')
      }
    } catch (error) {
      console.error('Error adding plan:', error)
      alert('Error adding plan')
    }
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      features: plan.features.length > 0 ? plan.features : [''],
      monthlyPrice: plan.monthlyPrice.toString(),
      yearlyPrice: plan.yearlyPrice.toString(),
      monthlyStripePriceId: plan.monthlyStripePriceId || '',
      yearlyStripePriceId: plan.yearlyStripePriceId || '',
    })
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return
    try {
      const features = planForm.features.filter((f) => f.trim() !== '')
      if (features.length === 0) {
        alert('Please add at least one feature')
        return
      }

      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          features,
          monthlyPrice: parseFloat(planForm.monthlyPrice),
          yearlyPrice: parseFloat(planForm.yearlyPrice),
          monthlyStripePriceId: planForm.monthlyStripePriceId || null,
          yearlyStripePriceId: planForm.yearlyStripePriceId || null,
        }),
      })
      if (res.ok) {
        setEditingPlan(null)
        setPlanForm({
          name: '',
          features: [''],
          monthlyPrice: '',
          yearlyPrice: '',
          monthlyStripePriceId: '',
          yearlyStripePriceId: '',
        })
        fetchPlans()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update plan')
      }
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Error updating plan')
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchPlans()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Error deleting plan')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/admin')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Subscription Plans</h1>
              <p className="text-muted-foreground mt-1">Manage subscription plans and pricing</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/admin')} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => setShowAddPlan(true)}>Add Plan</Button>
              <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Plans List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-2">
                      <div className="text-lg font-semibold">
                        ${plan.monthlyPrice}/month
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${plan.yearlyPrice}/year
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-sm">Features:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  {plan._count && plan._count.users > 0 && (
                    <div className="text-xs text-muted-foreground mb-4">
                      {plan._count.users} user{plan._count.users !== 1 ? 's' : ''} on this plan
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {plans.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No plans configured. Add one to get started.
              </CardContent>
            </Card>
          )}

          {/* Add Plan Modal */}
          {showAddPlan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Add Subscription Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddPlan} className="space-y-4">
                    <div>
                      <Label>Plan Name *</Label>
                      <Input
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        placeholder="e.g., Free, Premium"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Monthly Price ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={planForm.monthlyPrice}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, monthlyPrice: e.target.value })
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label>Yearly Price ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={planForm.yearlyPrice}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, yearlyPrice: e.target.value })
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Monthly Stripe Price ID (Optional)</Label>
                        <Input
                          value={planForm.monthlyStripePriceId}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, monthlyStripePriceId: e.target.value })
                          }
                          placeholder="price_xxxxx"
                        />
                      </div>
                      <div>
                        <Label>Yearly Stripe Price ID (Optional)</Label>
                        <Input
                          value={planForm.yearlyStripePriceId}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, yearlyStripePriceId: e.target.value })
                          }
                          placeholder="price_xxxxx"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Features *</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAddFeature}
                        >
                          Add Feature
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {planForm.features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => handleFeatureChange(index, e.target.value)}
                              placeholder="Enter feature description"
                            />
                            {planForm.features.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveFeature(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Add Plan</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddPlan(false)
                          setPlanForm({
                            name: '',
                            features: [''],
                            monthlyPrice: '',
                            yearlyPrice: '',
                            monthlyStripePriceId: '',
                            yearlyStripePriceId: '',
                          })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Edit Subscription Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Plan Name *</Label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monthly Price ($) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={planForm.monthlyPrice}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, monthlyPrice: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Yearly Price ($) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={planForm.yearlyPrice}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, yearlyPrice: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monthly Stripe Price ID (Optional)</Label>
                      <Input
                        value={planForm.monthlyStripePriceId}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, monthlyStripePriceId: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Yearly Stripe Price ID (Optional)</Label>
                      <Input
                        value={planForm.yearlyStripePriceId}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, yearlyStripePriceId: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Features *</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddFeature}
                      >
                        Add Feature
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {planForm.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder="Enter feature description"
                          />
                          {planForm.features.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveFeature(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSavePlan}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingPlan(null)
                        setPlanForm({
                          name: '',
                          features: [''],
                          monthlyPrice: '',
                          yearlyPrice: '',
                          monthlyStripePriceId: '',
                          yearlyStripePriceId: '',
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

