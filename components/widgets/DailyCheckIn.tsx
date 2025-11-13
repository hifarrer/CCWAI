'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { DailyCheckInInput } from '@/lib/types'

interface Symptom {
  name: string
  value: number
}

interface CheckIn {
  id: string
  checkInDate: Date
  symptoms: Record<string, number>
  notes: string | null
}

const commonSymptoms = [
  'nausea',
  'fatigue',
  'pain',
  'appetite',
  'sleep',
  'anxiety',
  'mood',
]

export function DailyCheckIn() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [symptoms, setSymptoms] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)

  useEffect(() => {
    fetchCheckIns()
  }, [])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/checkins')
      const data = await response.json()
      setCheckIns(data.checkIns || [])
      checkForAlerts(data.checkIns || [])
    } catch (error) {
      console.error('Error fetching check-ins:', error)
    }
  }

  const checkForAlerts = (checkIns: CheckIn[]) => {
    if (checkIns.length < 4) return

    const recent = checkIns.slice(0, 4)
    const highSymptoms: Record<string, number> = {}

    recent.forEach(checkIn => {
      Object.entries(checkIn.symptoms).forEach(([name, value]) => {
        // Alert if rating is 1 or 2 (sad emojis) for 4 days
        if (value <= 2) {
          highSymptoms[name] = (highSymptoms[name] || 0) + 1
        }
      })
    })

    const alertSymptoms = Object.entries(highSymptoms)
      .filter(([_, count]) => count >= 4)
      .map(([name]) => name)

    if (alertSymptoms.length > 0) {
      setAlert(
        `Your ${alertSymptoms.join(', ')} has been concerning for 4 days in a row. ` +
        `Consider discussing this with your oncology nurse.`
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, symptoms, notes }),
      })
      if (response.ok) {
        setSymptoms({})
        setNotes('')
        fetchCheckIns()
      }
    } catch (error) {
      console.error('Error submitting check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/checkins/export?format=pdf')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checkins-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-green">☺</div>
            <span>Daily Check-in</span>
          </div>
        </div>
        <div className="widget-subtitle">Track your well-being over time.</div>
        {alert && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">{alert}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="field-label">Today</label>
          <input
            className="field-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div className="mt-2 space-y-1">
            {commonSymptoms.slice(0, 4).map((symptom) => (
              <div key={symptom} className="symptom-row">
                <span className="capitalize">{symptom}</span>
                <div className="emoji-row">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const emojis = ['😞', '😕', '😐', '🙂', '😊']
                    const isSelected = symptoms[symptom] === rating
                    
                    return (
                      <span
                        key={rating}
                        onClick={() => setSymptoms({
                          ...symptoms,
                          [symptom]: rating,
                        })}
                        style={{ 
                          cursor: 'pointer',
                          opacity: isSelected ? 1 : 0.5,
                          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                          transition: 'all 0.2s'
                        }}
                        title={`Rate ${rating}`}
                      >
                        {emojis[rating - 1]}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <label className="field-label" style={{ marginTop: '8px' }}>Notes</label>
          <textarea
            className="field-textarea"
            placeholder="Anything you'd like to remember for your doctor?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Check-in'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

