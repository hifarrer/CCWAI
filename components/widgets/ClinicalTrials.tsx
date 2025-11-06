'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, MapPin, AlertCircle } from 'lucide-react'
import { TrialMatchCriteria } from '@/lib/types'

interface Trial {
  id: string
  nctId: string
  title: string
  description: string | null
  status: string | null
  conditions: string[]
  eligibilityCriteria: string | null
  locations: Array<{
    facility?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }>
  minimumAge?: string | null
  maximumAge?: string | null
}

export function ClinicalTrials() {
  const [criteria, setCriteria] = useState<TrialMatchCriteria>({})
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMatch = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/trials/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch trials')
      }
      
      const data = await response.json()
      setTrials(data.trials || [])
      
      if (data.trials && data.trials.length === 0) {
        setError('No trials found matching your criteria. Try adjusting your search parameters.')
      }
    } catch (error) {
      console.error('Error matching trials:', error)
      setError(error instanceof Error ? error.message : 'Failed to search for trials. Please try again.')
      setTrials([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Clinical Trials Near Me
          </CardTitle>
          <CardDescription>
            Find potential clinical trials
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="e.g., 45"
              value={criteria.age || ''}
              onChange={(e) => setCriteria({ ...criteria, age: parseInt(e.target.value) || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="search-term">Search Term</Label>
            <Input
              id="search-term"
              placeholder="e.g., Breast Cancer"
              value={criteria.cancerType || ''}
              onChange={(e) => setCriteria({ ...criteria, cancerType: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="mutations">Mutations (comma-separated)</Label>
            <Input
              id="mutations"
              placeholder="e.g., EGFR, KRAS"
              value={criteria.mutations?.join(', ') || ''}
              onChange={(e) => setCriteria({
                ...criteria,
                mutations: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
              })}
            />
          </div>
          <div>
            <Label htmlFor="zip-code">Zip Code</Label>
            <Input
              id="zip-code"
              placeholder="e.g., 10001"
              value={criteria.zipCode || ''}
              onChange={(e) => setCriteria({ ...criteria, zipCode: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={criteria.status?.join(',') || ''}
              onChange={(e) => {
                const value = e.target.value
                setCriteria({ 
                  ...criteria, 
                  status: value ? value.split(',').filter(Boolean) as any : undefined 
                })
              }}
            >
              <option value="">All Statuses (default: Recruiting)</option>
              <option value="RECRUITING">Recruiting</option>
              <option value="NOT_YET_RECRUITING">Not Yet Recruiting</option>
              <option value="ENROLLING_BY_INVITATION">Enrolling by Invitation</option>
              <option value="RECRUITING,NOT_YET_RECRUITING,ENROLLING_BY_INVITATION">Recruiting (All Types)</option>
              <option value="ACTIVE_NOT_RECRUITING">Active, Not Recruiting</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <Button onClick={handleMatch} className="w-full" disabled={loading}>
            {loading ? 'Searching...' : <><Search className="h-4 w-4 mr-2" />Find Trials</>}
          </Button>
        </div>

        {error && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          </div>
        )}

        {trials.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            {trials.map((trial) => (
              <div key={trial.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm flex-1">{trial.title}</h3>
                  <a
                    href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex-shrink-0"
                  >
                    {trial.nctId}
                  </a>
                </div>
                {trial.status && (
                  <p className="text-xs">
                    Status: <span className="font-medium">{trial.status}</span>
                  </p>
                )}
                {trial.conditions.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Conditions: {trial.conditions.join(', ')}
                  </p>
                )}
                {(trial.minimumAge || trial.maximumAge) && (
                  <p className="text-xs text-muted-foreground">
                    Age: {trial.minimumAge || 'N/A'} - {trial.maximumAge || 'N/A'}
                  </p>
                )}
                {trial.locations && trial.locations.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Locations:</span>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      {trial.locations.slice(0, 3).map((loc, idx) => (
                        <li key={idx}>
                          {[
                            loc.facility,
                            loc.city,
                            loc.state,
                            loc.zip
                          ].filter(Boolean).join(', ') || 'Location not specified'}
                        </li>
                      ))}
                      {trial.locations.length > 3 && (
                        <li className="italic">+ {trial.locations.length - 3} more locations</li>
                      )}
                    </ul>
                  </div>
                )}
                {trial.eligibilityCriteria && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                      View Eligibility Criteria
                    </summary>
                    <p className="mt-2 text-muted-foreground line-clamp-4">
                      {trial.eligibilityCriteria}
                    </p>
                  </details>
                )}
                <p className="text-xs italic text-primary pt-1">
                  This might be worth asking about with your oncologist.
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This information is for educational purposes only and does not constitute medical advice. 
            Consult your healthcare provider for personalized medical guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

