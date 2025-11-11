'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Heart } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CheckIn {
  id: string
  checkInDate: string | Date
  symptoms: Record<string, number>
  notes: string | null
}

interface WellnessDataPoint {
  date: string
  dateObj: Date
  averageScore: number
  symptomCount: number
}

export function OverallWellness() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [wellnessData, setWellnessData] = useState<WellnessDataPoint[]>([])
  const [trend, setTrend] = useState<'improving' | 'worsening' | 'stable'>('stable')
  const [change, setChange] = useState(0)

  useEffect(() => {
    fetchCheckIns()
  }, [])

  useEffect(() => {
    if (checkIns.length > 0) {
      calculateWellness()
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

  const calculateWellness = () => {
    const dataPoints: WellnessDataPoint[] = []

    checkIns.forEach((checkIn) => {
      const checkInDate = typeof checkIn.checkInDate === 'string' 
        ? new Date(checkIn.checkInDate) 
        : checkIn.checkInDate
      const date = formatDate(checkInDate)
      const dateObj = checkInDate instanceof Date ? checkInDate : new Date(checkInDate)

      // Calculate average score across all symptoms for this check-in
      const symptomValues = Object.values(checkIn.symptoms).filter(v => typeof v === 'number' && v > 0) as number[]
      
      if (symptomValues.length > 0) {
        const averageScore = symptomValues.reduce((sum, val) => sum + val, 0) / symptomValues.length
        
        dataPoints.push({
          date,
          dateObj,
          averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
          symptomCount: symptomValues.length,
        })
      }
    })

    // Sort by date (oldest first)
    const sortedData = dataPoints.sort((a, b) => 
      a.dateObj.getTime() - b.dateObj.getTime()
    )

    setWellnessData(sortedData)

    // Calculate overall trend
    if (sortedData.length >= 2) {
      // First score is the oldest, last score is the newest
      const oldestScore = sortedData[0].averageScore  // Oldest check-in (first in time)
      const newestScore = sortedData[sortedData.length - 1].averageScore  // Newest check-in (last in time)
      const scoreChange = newestScore - oldestScore

      setChange(scoreChange)

      // Higher score = better (1 is worst, 5 is best)
      // If score increases from oldest to newest, patient is improving
      // scoreChange > 0 means score went up = improving
      // scoreChange < 0 means score went down = worsening
      if (scoreChange > 0.3) {
        setTrend('improving')
      } else if (scoreChange < -0.3) {
        setTrend('worsening')
      } else {
        setTrend('stable')
      }
    } else {
      setTrend('stable')
      setChange(0)
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-600" /> // Score going up = improving
      case 'worsening':
        return <TrendingDown className="h-5 w-5 text-red-600" /> // Score going down = worsening
      default:
        return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'text-green-600'
      case 'worsening':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEmoji = (score: number) => {
    if (score <= 2) return '😢'
    if (score <= 2.5) return '😟'
    if (score <= 3.5) return '😐'
    if (score <= 4.5) return '😊'
    return '😄'
  }

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'text-red-500'
    if (score <= 2.5) return 'text-yellow-500'
    if (score <= 3.5) return 'text-gray-500'
    if (score <= 4.5) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getBarColor = (score: number) => {
    if (score <= 2) return 'bg-red-400'
    if (score <= 2.5) return 'bg-yellow-400'
    if (score <= 3.5) return 'bg-gray-400'
    if (score <= 4.5) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Overall Wellness
          </CardTitle>
          <CardDescription>Your combined symptom improvement over time</CardDescription>
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
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Overall Wellness
          </CardTitle>
          <CardDescription>Your combined symptom improvement over time</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground text-sm">
            No check-in data available. Start tracking your symptoms to see your wellness trend.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (wellnessData.length < 2) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Overall Wellness
          </CardTitle>
          <CardDescription>Your combined symptom improvement over time</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground text-sm">
            Need at least 2 check-ins to show wellness trend.
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxScore = Math.max(...wellnessData.map(d => d.averageScore), 5)
  const minScore = Math.min(...wellnessData.map(d => d.averageScore), 1)
  const range = maxScore - minScore || 1

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Overall Wellness
        </CardTitle>
        <CardDescription>Your combined symptom improvement over time</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Trend Summary */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getTrendIcon()}
            <div>
              <div className="text-sm font-medium">Overall Trend</div>
              <div className={`text-lg font-bold ${getTrendColor()}`}>
                {trend === 'improving' ? 'Improving' : 
                 trend === 'worsening' ? 'Worsening' : 'Stable'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Change</div>
            <div className={`text-lg font-bold ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Current Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Current Average</div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(wellnessData[wellnessData.length - 1].averageScore)}`}>
                {wellnessData[wellnessData.length - 1].averageScore.toFixed(1)}
              </span>
              <span className="text-2xl">{getEmoji(wellnessData[wellnessData.length - 1].averageScore)}</span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">First Average</div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getScoreColor(wellnessData[0].averageScore)}`}>
                {wellnessData[0].averageScore.toFixed(1)}
              </span>
              <span className="text-lg">{getEmoji(wellnessData[0].averageScore)}</span>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="relative h-32 bg-gray-50 rounded-lg p-3 border flex-1">
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            {/* Draw lines connecting points */}
            {wellnessData.map((point, index) => {
              if (index === wellnessData.length - 1) return null
              
              const x1 = ((index + 0.5) / wellnessData.length) * 100
              const y1 = 100 - (((point.averageScore - minScore) / range) * 90 + 10)
              const nextPoint = wellnessData[index + 1]
              const x2 = ((index + 1.5) / wellnessData.length) * 100
              const y2 = 100 - (((nextPoint.averageScore - minScore) / range) * 90 + 10)
              
              return (
                <line
                  key={`line-${index}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  className="transition-all"
                />
              )
            })}
          </svg>
          
          <div className="relative w-full h-full">
            {wellnessData.map((point, index) => {
              const isLatest = index === wellnessData.length - 1
              const xPercent = ((index + 0.5) / wellnessData.length) * 100
              const yPercent = 100 - (((point.averageScore - minScore) / range) * 90 + 10)
              
              return (
                <div
                  key={index}
                  className="absolute group z-10"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Data point circle */}
                  <div
                    className={`w-3 h-3 rounded-full ${getBarColor(point.averageScore)} ${
                      isLatest ? 'ring-2 ring-offset-1 ring-gray-600 scale-125' : ''
                    } transition-all cursor-pointer`}
                    title={`${point.date}: ${point.averageScore.toFixed(1)}/5`}
                  />
                  
                  {/* Hover tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 pointer-events-none">
                    {point.date}: {point.averageScore.toFixed(1)}/5
                  </div>
                  
                  {/* Date label */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
            <span className="text-[10px]">{maxScore.toFixed(1)}</span>
            <span className="text-[10px]">{minScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Check-ins</div>
            <div className="text-sm font-medium">{wellnessData.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Best Score</div>
            <div className={`text-sm font-medium ${getScoreColor(Math.max(...wellnessData.map(d => d.averageScore)))}`}>
              {Math.max(...wellnessData.map(d => d.averageScore)).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Days Tracked</div>
            <div className="text-sm font-medium">
              {Math.ceil((wellnessData[wellnessData.length - 1].dateObj.getTime() - wellnessData[0].dateObj.getTime()) / (1000 * 60 * 60 * 24))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

