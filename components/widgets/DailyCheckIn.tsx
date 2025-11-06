'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Download, AlertCircle } from 'lucide-react'
import { DailyCheckInInput } from '@/lib/types'
import { formatDate } from '@/lib/utils'

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
        if (value >= 7) {
          highSymptoms[name] = (highSymptoms[name] || 0) + 1
        }
      })
    })

    const alertSymptoms = Object.entries(highSymptoms)
      .filter(([_, count]) => count >= 4)
      .map(([name]) => name)

    if (alertSymptoms.length > 0) {
      setAlert(
        `Your ${alertSymptoms.join(', ')} has been high for 4 days in a row. ` +
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
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Check-In
          </CardTitle>
          <CardDescription>
            Track your symptoms and well-being
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {alert && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">{alert}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="checkin-date">Date</Label>
            <Input
              id="checkin-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Symptoms (Rate 1-10)</Label>
            <div className="space-y-2 mt-2">
              {commonSymptoms.map((symptom) => (
                <div key={symptom} className="flex items-center justify-between">
                  <Label htmlFor={symptom} className="text-xs capitalize">
                    {symptom}
                  </Label>
                  <Input
                    id={symptom}
                    type="number"
                    min="1"
                    max="10"
                    value={symptoms[symptom] || ''}
                    onChange={(e) => setSymptoms({
                      ...symptoms,
                      [symptom]: parseInt(e.target.value) || 0,
                    })}
                    className="w-20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Check-In'}
          </Button>
        </form>

        {checkIns.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Recent Check-Ins</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            <div className="space-y-2">
              {checkIns.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="border rounded-lg p-3 text-xs">
                  <p className="font-medium mb-1">
                    {formatDate(checkIn.checkInDate)}
                  </p>
                  {checkIn.notes && (
                    <p className="text-muted-foreground mb-1">{checkIn.notes}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(checkIn.symptoms).map(([name, value]) => (
                      <span key={name} className="text-xs">
                        {name}: {value}/10
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This tool helps you track symptoms for discussion with your healthcare team. 
            It does not replace medical advice or emergency care.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

