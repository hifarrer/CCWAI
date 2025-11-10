'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { TrendingUp, Beaker, FileText, Award } from 'lucide-react'

interface OverviewData {
  newTrials: number
  approvals: number
  recentPapers: number
  totalArticles: number
  totalNews: number
  totalTrials: number
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
    // Get user's cancer type from profile
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          const cancerType = data.user?.cancerType
          if (cancerType) {
            fetchOverview(cancerType)
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    if (session) {
      fetchUserProfile()
    }
  }, [session])

  const fetchOverview = async (cancerType: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/overview/${encodeURIComponent(cancerType)}`)
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
                  <p className="text-xs font-medium text-blue-900">Total Trials</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">{overview.totalTrials}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {overview.newTrials} new in last 14 days
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-medium text-green-900">FDA Approvals</p>
                </div>
                <p className="text-2xl font-bold text-green-900">{overview.approvals}</p>
                <p className="text-xs text-green-700 mt-1">Last 90 days</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-900">Total Articles</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">{overview.totalArticles}</p>
                <p className="text-xs text-purple-700 mt-1">
                  {overview.recentPapers} new in last 30 days
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <p className="text-xs font-medium text-orange-900">Total News</p>
                </div>
                <p className="text-2xl font-bold text-orange-900">{overview.totalNews}</p>
              </div>
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

