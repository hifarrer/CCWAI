'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CancerTypeBarChart } from '@/components/admin/CancerTypeChart'
import { BarChart3 } from 'lucide-react'

interface CancerTypeStat {
  cancerType: string
  count: number
  percentage: number
}

interface ArticleStats {
  cancerTypeStats: CancerTypeStat[]
  totalPapers: number
}

export function ArticlesByCancerType() {
  const [stats, setStats] = useState<ArticleStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/articles/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching article stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Articles by Cancer Type
        </CardTitle>
        <CardDescription>
          Distribution of research articles by cancer type
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : stats && stats.cancerTypeStats && stats.cancerTypeStats.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total articles: {stats.totalPapers.toLocaleString()}
            </div>
            <CancerTypeBarChart
              data={stats.cancerTypeStats}
              total={stats.totalPapers}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

