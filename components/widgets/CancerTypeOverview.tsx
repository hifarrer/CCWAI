'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

interface SymptomTrend {
  symptom: string
  data: Array<{ date: string; value: number }>
  trend: 'improving' | 'worsening' | 'stable'
  change: number
}

// Map cancer type values to display labels
const CANCER_TYPE_LABELS: Record<string, string> = {
  breast: 'Breast Cancer',
  lung: 'Lung Cancer',
  colorectal: 'Colorectal Cancer',
  prostate: 'Prostate Cancer',
  pancreatic: 'Pancreatic Cancer',
  liver: 'Liver Cancer',
  stomach: 'Stomach Cancer',
  esophageal: 'Esophageal Cancer',
  bladder: 'Bladder Cancer',
  kidney: 'Kidney Cancer',
  cervical: 'Cervical Cancer',
  ovarian: 'Ovarian Cancer',
  leukemia: 'Leukemia',
  lymphoma: 'Lymphoma',
  melanoma: 'Melanoma',
  brain: 'Brain Cancer',
  other: 'Other',
}

export function CancerTypeOverview() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'wellness' | 'symptoms'>('overview')
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancerType, setCancerType] = useState<string | null>(null)
  
  // Wellness state
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [wellnessLoading, setWellnessLoading] = useState(true)
  const [wellnessData, setWellnessData] = useState<WellnessDataPoint[]>([])
  const [trend, setTrend] = useState<'improving' | 'worsening' | 'stable'>('stable')
  const [change, setChange] = useState(0)
  
  // Symptoms state
  const [symptomTrends, setSymptomTrends] = useState<SymptomTrend[]>([])

  const fetchOverview = useCallback(async (cancerType: string) => {
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
  }, [])

  useEffect(() => {
    // Get user's cancer type from profile
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          const userCancerType = data.user?.cancerType
          if (userCancerType) {
            setCancerType(userCancerType)
            fetchOverview(userCancerType)
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    if (session) {
      fetchUserProfile()
    }
  }, [session, fetchOverview])

  // Separate effect for event listener and periodic refresh
  useEffect(() => {
    if (!cancerType) return

    // Listen for custom event when trials are saved
    const handleTrialsUpdated = () => {
      fetchOverview(cancerType)
    }

    window.addEventListener('trialsUpdated', handleTrialsUpdated)

    // Also refresh periodically (every 5 minutes) to catch any updates
    const refreshInterval = setInterval(() => {
      fetchOverview(cancerType)
    }, 300000)

    return () => {
      window.removeEventListener('trialsUpdated', handleTrialsUpdated)
      clearInterval(refreshInterval)
    }
  }, [cancerType, fetchOverview])

  // Wellness functions
  useEffect(() => {
    fetchCheckIns()
  }, [])

  useEffect(() => {
    if (checkIns.length > 0) {
      calculateWellness()
      calculateSymptomTrends()
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
      setWellnessLoading(false)
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
          averageScore: Math.round(averageScore * 10) / 10,
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
      const oldestScore = sortedData[0].averageScore
      const newestScore = sortedData[sortedData.length - 1].averageScore
      const scoreChange = newestScore - oldestScore

      setChange(scoreChange)

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

  const calculateSymptomTrends = () => {
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
    const trends: SymptomTrend[] = Object.entries(symptomData)
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

    setSymptomTrends(trends)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'worsening':
        return <TrendingDown className="h-4 w-4 text-red-600" />
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

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">i</div>
            <span>My Overview</span>
          </div>
        </div>
        <div className="widget-subtitle">
          {cancerType
            ? `Personalized insights for ${CANCER_TYPE_LABELS[cancerType] || cancerType}`
            : 'Personalized insights for your cancer research journey.'}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3 border-b border-[var(--border-soft)]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-[var(--brand-blue)] border-b-2 border-[var(--brand-blue)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('wellness')}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'wellness'
                ? 'text-[var(--brand-green)] border-b-2 border-[var(--brand-green)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Wellness
          </button>
          <button
            onClick={() => setActiveTab('symptoms')}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'symptoms'
                ? 'text-[var(--brand-green)] border-b-2 border-[var(--brand-green)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Symptoms
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : overview ? (
              <>
                <div className="metric-row">
                  <a
                    href={`/trials${cancerType ? `?cancerType=${cancerType}` : ''}`}
                    className="metric hover:bg-[#f3e8ff] transition-colors cursor-pointer"
                  >
                    <span className="metric-label">Clinical Trials</span>
                    <span className="metric-value">{overview.totalTrials}</span>
                  </a>
                  <a
                    href={`/fda-approvals${cancerType ? `?cancerType=${cancerType}` : ''}`}
                    className="metric hover:bg-[#f3e8ff] transition-colors cursor-pointer"
                  >
                    <span className="metric-label">FDA Approvals</span>
                    <span className="metric-value green">{overview.approvals}</span>
                  </a>
                </div>
                <div className="metric-row">
                  <a
                    href={`/articles${cancerType ? `?cancerType=${cancerType}` : ''}`}
                    className="metric hover:bg-[#f3e8ff] transition-colors cursor-pointer"
                  >
                    <span className="metric-label">Total Articles</span>
                    <span className="metric-value purple">{overview.totalArticles.toLocaleString()}</span>
                  </a>
                  <div className="metric">
                    <span className="metric-label">New Last 30 Days</span>
                    <span className="metric-value">{overview.recentPapers}</span>
                  </div>
                </div>
                {overview.trends.length > 0 && (
                  <ul className="list">
                    {overview.trends.map((trend, idx) => (
                      <li key={idx}>
                        <span className="list-item-title">{trend.label}: {trend.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Update your profile to see personalized insights.
              </div>
            )}
          </>
        )}

        {/* Wellness Tab */}
        {activeTab === 'wellness' && (
          <>
            {wellnessLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : checkIns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No check-in data available. Start tracking your symptoms to see your wellness trend.
              </div>
            ) : wellnessData.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Need at least 2 check-ins to show wellness trend.
              </div>
            ) : (
              <>
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

                <div style={{
                  height: '130px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #ebf5ff, #f7edff)',
                  marginBottom: '8px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none" style={{ display: 'block' }}>
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="300" y2="25" stroke="#e4e7f2" strokeWidth="0.5" opacity="0.5" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#e4e7f2" strokeWidth="0.5" opacity="0.5" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="#e4e7f2" strokeWidth="0.5" opacity="0.5" />
                    
                    {/* Line chart */}
                    <polyline
                      fill="none"
                      stroke="#8dd08d"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={wellnessData.map((point, index) => {
                        const x = (index / (wellnessData.length - 1)) * 300
                        const y = 100 - (point.averageScore / 5) * 100
                        return `${x},${y}`
                      }).join(' ')}
                    />
                    
                    {/* Data points */}
                    {wellnessData.map((point, index) => {
                      const x = (index / (wellnessData.length - 1)) * 300
                      const y = 100 - (point.averageScore / 5) * 100
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#8dd08d"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                      )
                    })}
                    
                    {/* Gradient fill under the line */}
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(141, 208, 141, 0.3)" />
                        <stop offset="100%" stopColor="rgba(141, 208, 141, 0.05)" />
                      </linearGradient>
                    </defs>
                    <polygon
                      fill="url(#lineGradient)"
                      points={[
                        ...wellnessData.map((point, index) => {
                          const x = (index / (wellnessData.length - 1)) * 300
                          const y = 100 - (point.averageScore / 5) * 100
                          return `${x},${y}`
                        }),
                        '300,100',
                        '0,100'
                      ].join(' ')}
                    />
                  </svg>
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
              </>
            )}
          </>
        )}

        {/* Symptoms Tab */}
        {activeTab === 'symptoms' && (
          <>
            {wellnessLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : checkIns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No check-in data available. Start tracking your symptoms to see trends.
              </div>
            ) : symptomTrends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Need at least 2 check-ins to show trends.
              </div>
            ) : (
              <div className="list">
                {symptomTrends.slice(0, 4).map((trend) => {
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
          </>
        )}
      </div>
    </div>
  )
}

