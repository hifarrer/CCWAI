'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CheckIn {
  id: string
  checkInDate: string | Date
  symptoms: Record<string, number>
  notes: string | null
}

interface SymptomTrend {
  symptom: string
  data: Array<{ date: string; value: number }>
  trend: 'improving' | 'worsening' | 'stable'
  change: number
}

export function SymptomsChart() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [trends, setTrends] = useState<SymptomTrend[]>([])

  useEffect(() => {
    fetchCheckIns()
  }, [])

  useEffect(() => {
    if (checkIns.length > 0) {
      calculateTrends()
    }
  }, [checkIns])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/checkins')
      if (response.ok) {
        const data = await response.json()
        setCheckIns(data.checkIns || [])
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrends = () => {
    const symptomData: Record<string, Array<{ date: string; value: number; dateObj: Date }>> = {}
    
    // Group check-ins by symptom
    checkIns.forEach((checkIn) => {
      const checkInDate = typeof checkIn.checkInDate === 'string' 
        ? new Date(checkIn.checkInDate) 
        : checkIn.checkInDate
      const date = formatDate(checkInDate)
      const dateObj = checkInDate instanceof Date ? checkInDate : new Date(checkInDate)
      
      Object.entries(checkIn.symptoms).forEach(([name, value]) => {
        if (!symptomData[name]) {
          symptomData[name] = []
        }
        symptomData[name].push({ date, value: value as number, dateObj })
      })
    })

    // Calculate trends for each symptom
    const symptomTrends: SymptomTrend[] = Object.entries(symptomData)
      .filter(([_, data]) => data.length >= 2) // Need at least 2 data points
      .map(([symptom, data]) => {
        // Sort by date
        const sortedData = data.sort((a, b) => 
          a.dateObj.getTime() - b.dateObj.getTime()
        ).map(({ dateObj, ...rest }) => rest) // Remove dateObj from final data

        // Calculate trend (compare first and last values)
        const firstValue = sortedData[0].value
        const lastValue = sortedData[sortedData.length - 1].value
        const change = lastValue - firstValue

        let trend: 'improving' | 'worsening' | 'stable' = 'stable'
        if (change > 0.5) {
          trend = 'improving' // Higher number is better (1 is worst, 5 is best)
        } else if (change < -0.5) {
          trend = 'worsening'
        }

        return {
          symptom,
          data: sortedData,
          trend,
          change,
        }
      })
      .sort((a, b) => {
        // Sort by trend priority: worsening first, then improving, then stable
        const priority = { worsening: 0, improving: 1, stable: 2 }
        return priority[a.trend] - priority[b.trend]
      })

    setTrends(symptomTrends)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600'
      case 'worsening':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEmoji = (value: number) => {
    const emojis = ['😢', '😟', '😐', '😊', '😄']
    return emojis[value - 1] || '😐'
  }

  const getMaxValue = (data: Array<{ date: string; value: number }>) => {
    return Math.max(...data.map(d => d.value), 5)
  }

  const getMinValue = (data: Array<{ date: string; value: number }>) => {
    return Math.min(...data.map(d => d.value), 1)
  }

  if (loading) {
    return (
      <div className="widget">
        <div className="widget-inner">
          <div className="widget-header">
            <div className="widget-title">
              <div className="widget-pill pill-green">📈</div>
              <span>Symptoms Trend</span>
            </div>
          </div>
          <div className="widget-subtitle">See how your symptoms change over time.</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (checkIns.length === 0) {
    return (
      <div className="widget">
        <div className="widget-inner">
          <div className="widget-header">
            <div className="widget-title">
              <div className="widget-pill pill-green">📈</div>
              <span>Symptoms Trend</span>
            </div>
          </div>
          <div className="widget-subtitle">See how your symptoms change over time.</div>
          <div className="text-center text-muted-foreground text-sm">
            No check-in data available. Start tracking your symptoms to see trends.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="widget">
      <div className="widget-inner">
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-green">📈</div>
            <span>Symptoms Trend</span>
          </div>
        </div>
        <div className="widget-subtitle">See how your symptoms change over time.</div>
        {trends.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm">
            Need at least 2 check-ins to show trends.
          </div>
        ) : (
          <div className="list">
            {trends.slice(0, 4).map((trend) => {
              const latestValue = trend.data[trend.data.length - 1].value
              const percentage = ((latestValue - 1) / 4) * 100
              const trendLabel = trend.trend === 'improving' ? 'Improving' : 
                                trend.trend === 'worsening' ? 'Worsening' : 'Stable'
              
              // Get trend icon and color
              const trendIcon = getTrendIcon(trend.trend)
              const trendColorClass = getTrendColor(trend.trend)
              
              // Format change value
              const changeValue = trend.change > 0 ? `+${trend.change.toFixed(1)}` : trend.change.toFixed(1)
              
              // Determine bar color based on trend
              const barColorClass = trend.trend === 'improving' ? 'green' : 
                                   trend.trend === 'worsening' ? 'purple' : ''
              
              return (
                <div key={trend.symptom} className="bar-row">
                  <span className="capitalize">{trend.symptom}</span>
                  <div className="bar">
                    <div 
                      className={`bar-fill ${barColorClass}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className={`percentage ${trendColorClass}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    {trendIcon}
                    <span>{trendLabel}</span>
                    <span style={{ fontSize: '0.85em', opacity: 0.8 }}>({changeValue})</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

