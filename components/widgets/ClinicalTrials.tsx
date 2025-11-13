'use client'

import { useState } from 'react'
import { TrialMatchCriteria, CancerType } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

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
      } else if (data.trials && data.trials.length > 0) {
        // Dispatch event to notify that trials were updated
        // Wait a moment for the server-side save to complete
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('trialsUpdated'))
        }, 2000) // 2 second delay to allow server-side save to complete
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
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">🔍</div>
            <span>Clinical Trials Near Me</span>
          </div>
        </div>
        <div className="widget-subtitle">Find potential trials you might discuss with your doctor.</div>
        <div className="space-y-2">
          <div>
            <label className="field-label">Cancer Type</label>
            <select
              className="field-select"
              value={criteria.cancerType || ''}
              onChange={(e) => {
                const value = e.target.value
                setCriteria({ 
                  ...criteria, 
                  cancerType: value ? (value as CancerType) : undefined 
                })
              }}
            >
              <option value="">Select Cancer Type</option>
              <option value="breast">Breast Cancer</option>
              <option value="lung">Lung Cancer</option>
              <option value="colorectal">Colorectal Cancer</option>
              <option value="prostate">Prostate Cancer</option>
            </select>
          </div>
          <div>
            <label className="field-label">Zip Code</label>
            <input
              className="field-input"
              placeholder="e.g. 60601"
              value={criteria.zipCode || ''}
              onChange={(e) => setCriteria({ ...criteria, zipCode: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Mutations (optional)</label>
            <input
              className="field-input"
              placeholder="e.g. BRCA1, BRCA2"
              value={criteria.mutations?.join(', ') || ''}
              onChange={(e) => setCriteria({
                ...criteria,
                mutations: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
              })}
            />
          </div>
          <div className="flex justify-end mt-2">
            <button className="btn btn-primary" onClick={handleMatch} disabled={loading}>
              {loading ? 'Searching...' : 'Find Trials'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-xs text-red-600">{error}</div>
        )}

        {trials.length > 0 && (
          <ul className="list mt-2">
            {trials.slice(0, 3).map((trial) => (
              <li 
                key={trial.id}
                onClick={() => {
                  if (trial.nctId) {
                    window.open(`https://clinicaltrials.gov/study/${trial.nctId}`, '_blank', 'noopener,noreferrer')
                  }
                }}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ cursor: trial.nctId ? 'pointer' : 'default' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="list-item-title">{trial.title}</span>
                    <div className="list-item-meta">{trial.status || 'Status unknown'}</div>
                  </div>
                  {trial.nctId && (
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

