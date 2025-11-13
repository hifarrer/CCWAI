'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
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

  const handleCancerTypeClick = (cancerType: string) => {
    router.push(`/articles?cancerType=${encodeURIComponent(cancerType)}`)
  }

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">📚</div>
            <span>Articles by Cancer Type</span>
          </div>
        </div>
        <div className="widget-subtitle">Distribution of articles by cancer type.</div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : stats && stats.cancerTypeStats && stats.cancerTypeStats.length > 0 ? (
          <div className="list" style={{ flex: 1, minHeight: 0 }}>
            {(() => {
              // Calculate max percentage to normalize bars (highest value shows as 100%)
              const maxPercentage = Math.max(...stats.cancerTypeStats.map((s) => s.percentage))
              return stats.cancerTypeStats.map((stat) => {
                // Normalize width so the highest percentage fills 100% of the bar
                const normalizedWidth = maxPercentage > 0 ? (stat.percentage / maxPercentage) * 100 : 0
                return (
                  <div 
                    key={stat.cancerType} 
                    className="bar-row"
                    onClick={() => handleCancerTypeClick(stat.cancerType)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>{stat.cancerType}</span>
                    <div className="bar">
                      <div 
                        className={`bar-fill ${stat.percentage > 50 ? 'purple' : stat.percentage > 20 ? '' : 'green'}`}
                        style={{ width: `${normalizedWidth}%` }}
                      ></div>
                    </div>
                    <span className="percentage">{stat.percentage}%</span>
                  </div>
                )
              })
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">No data available</div>
        )}
      </div>
    </div>
  )
}

