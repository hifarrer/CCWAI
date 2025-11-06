'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { TrendingUp, Beaker, FileText, Award } from 'lucide-react'

interface OverviewData {
  newTrials: number
  approvals: number
  recentPapers: number
  trends: {
    label: string
    value: string
  }[]
}

export function CancerTypeOverview() {
  const { data: session } = useSession()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get user's cancer type from session or default
    const cancerType = 'breast' // TODO: Get from user profile
    if (cancerType) {
      fetchOverview(cancerType)
    }
  }, [session])

  const fetchOverview = async (cancerType: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/overview/${cancerType}`)
      const data = await response.json()
      setOverview(data)
    } catch (error) {
      console.error('Error fetching overview:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            My Cancer Type Overview
          </CardTitle>
          <CardDescription>
            Personalized insights for your cancer type
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : overview ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-medium text-blue-900">New Trials (14 days)</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">{overview.newTrials}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-medium text-green-900">FDA Approvals</p>
                </div>
                <p className="text-2xl font-bold text-green-900">{overview.approvals}</p>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-medium text-purple-900">Recent Papers (30 days)</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{overview.recentPapers}</p>
            </div>
            {overview.trends.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Highlights:</p>
                {overview.trends.map((trend, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground border-l-2 border-primary pl-2">
                    {trend.label}: {trend.value}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Update your profile to see personalized insights.
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This information is for educational purposes only.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

