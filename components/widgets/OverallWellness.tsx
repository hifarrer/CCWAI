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
      <div className="widget">
        <div className="widget-inner">
          <div className="widget-header">
            <div className="widget-title">
              <div className="widget-pill pill-green">✓</div>
              <span>Overall Wellness</span>
            </div>
          </div>
          <div className="widget-subtitle">Track your symptom improvement over time.</div>
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
              <div className="widget-pill pill-green">✓</div>
              <span>Overall Wellness</span>
            </div>
          </div>
          <div className="widget-subtitle">Track your symptom improvement over time.</div>
          <div className="text-center text-muted-foreground text-sm">
            No check-in data available. Start tracking your symptoms to see your wellness trend.
          </div>
        </div>
      </div>
    )
  }

  if (wellnessData.length < 2) {
    return (
      <div className="widget">
        <div className="widget-inner">
          <div className="widget-header">
            <div className="widget-title">
              <div className="widget-pill pill-green">✓</div>
              <span>Overall Wellness</span>
            </div>
          </div>
          <div className="widget-subtitle">Track your symptom improvement over time.</div>
          <div className="text-center text-muted-foreground text-sm">
            Need at least 2 check-ins to show wellness trend.
          </div>
        </div>
      </div>
    )
  }

  const maxScore = Math.max(...wellnessData.map(d => d.averageScore), 5)
  const minScore = Math.min(...wellnessData.map(d => d.averageScore), 1)
  const range = maxScore - minScore || 1

  return (
    <div className="widget">
      <div className="widget-inner">
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-green">✓</div>
            <span>Overall Wellness</span>
          </div>
        </div>
        <div className="widget-subtitle">Track your symptom improvement over time.</div>

        <div className="metric-row">
          <div className="metric">
            <span className="metric-label">Overall Trend</span>
            <span className={`metric-value ${trend === 'improving' ? 'green' : ''}`}>
              {trend === 'improving' ? 'Improving' : 
               trend === 'worsening' ? 'Worsening' : 'Stable'}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Change</span>
            <span className={`metric-value ${trend === 'improving' ? 'green' : ''}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="chart-placeholder">
          <div className="chart-line"></div>
        </div>

        <div className="metric-row">
          <div className="metric">
            <span className="metric-label">Check-ins</span>
            <span className="metric-value">{wellnessData.length}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Current Avg</span>
            <span className="metric-value green">{wellnessData[wellnessData.length - 1].averageScore.toFixed(1)} / 5.0</span>
          </div>
          <div className="metric">
            <span className="metric-label">First Avg</span>
            <span className="metric-value">{wellnessData[0].averageScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

