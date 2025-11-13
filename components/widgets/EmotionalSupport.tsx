'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, ExternalLink, Phone, Mail } from 'lucide-react'

interface SupportResource {
  id: string
  name: string
  description: string | null
  category: string | null
  contactInfo: any
  eligibility: string | null
  url: string | null
  cancerTypes: string[]
  regions: string[]
}

export function EmotionalSupport() {
  const [resources, setResources] = useState<SupportResource[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/support-resources?limit=5')
      const data = await response.json()
      setResources(data.resources || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      nonprofit: 'Nonprofit',
      travel_grant: 'Travel Grant',
      caregiver_support: 'Caregiver Support',
      patient_navigator: 'Patient Navigator',
      financial_assistance: 'Financial Assistance',
    }
    return labels[category || ''] || category || 'Support Resource'
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Emotional Support & Practical Help
          </CardTitle>
          <CardDescription>
            Support services and resources
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No support resources available.
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm flex-1">{resource.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {getCategoryLabel(resource.category)}
                  </span>
                </div>
                {resource.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                )}
                {resource.eligibility && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Eligibility:</span> {resource.eligibility}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {resource.contactInfo?.phone && (
                    <a
                      href={`tel:${resource.contactInfo.phone}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {resource.contactInfo.phone}
                    </a>
                  )}
                  {resource.contactInfo?.email && (
                    <a
                      href={`mailto:${resource.contactInfo.email}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </a>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            These resources are provided for informational purposes. 
            Contact each organization directly to verify eligibility and services.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}




