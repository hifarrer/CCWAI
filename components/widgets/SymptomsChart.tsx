'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        if (change < -0.5) {
          trend = 'improving' // Lower number is better (1 is worst, 5 is best)
        } else if (change > 0.5) {
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
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Symptoms Trend</CardTitle>
          <CardDescription>Track your symptom improvement over time</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (checkIns.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Symptoms Trend</CardTitle>
          <CardDescription>Track your symptom improvement over time</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground text-sm">
            No check-in data available. Start tracking your symptoms to see trends.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Symptoms Trend</CardTitle>
        <CardDescription>Track your symptom improvement over time</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6 max-h-[500px] pr-2">
        {trends.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm">
            Need at least 2 check-ins to show trends.
          </div>
        ) : (
          trends.map((trend) => {
            const maxValue = getMaxValue(trend.data)
            const minValue = getMinValue(trend.data)
            const range = maxValue - minValue || 1

            return (
              <div key={trend.symptom} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{trend.symptom}</span>
                    {getTrendIcon(trend.trend)}
                    <span className={`text-xs font-medium ${getTrendColor(trend.trend)}`}>
                      {trend.trend === 'improving' ? 'Improving' : 
                       trend.trend === 'worsening' ? 'Worsening' : 'Stable'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trend.data.length} check-ins
                  </div>
                </div>
                
                {/* Simple line chart visualization */}
                <div className="relative h-20 bg-gray-50 rounded-lg p-2 border">
                  <div className="flex items-end justify-between h-full gap-1">
                    {trend.data.map((point, index) => {
                      // Normalize height: map value (1-5) to height percentage
                      // Value 1 = 10%, Value 5 = 100%
                      const height = ((point.value - 1) / 4) * 90 + 10
                      const isLatest = index === trend.data.length - 1
                      
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center justify-end group relative min-w-[20px]"
                        >
                          <div
                            className={`w-full rounded-t transition-all ${
                              point.value <= 2 
                                ? 'bg-red-400' 
                                : point.value === 3 
                                ? 'bg-yellow-400' 
                                : 'bg-green-400'
                            } ${isLatest ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`}
                            style={{ height: `${height}%`, minHeight: '8px' }}
                            title={`${point.date}: ${getEmoji(point.value)} (${point.value}/5)`}
                          />
                          {isLatest && (
                            <span className="absolute -top-5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {getEmoji(point.value)}
                            </span>
                          )}
                          <span className="text-[8px] text-muted-foreground mt-1 truncate w-full text-center">
                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Y-axis labels */}
                  <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
                    <span className="text-[10px]">5</span>
                    <span className="text-[10px]">1</span>
                  </div>
                </div>

                {/* Data points summary */}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>First: {getEmoji(trend.data[0].value)} ({trend.data[0].value}/5)</span>
                  <span>•</span>
                  <span>Latest: {getEmoji(trend.data[trend.data.length - 1].value)} ({trend.data[trend.data.length - 1].value}/5)</span>
                  {trend.change !== 0 && (
                    <>
                      <span>•</span>
                      <span className={getTrendColor(trend.trend)}>
                        Change: {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

