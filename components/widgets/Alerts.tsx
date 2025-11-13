'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useSession } from 'next-auth/react'

type AlertScope = 'all' | 'myType' | 'none'

interface AlertPreferences {
  clinicalTrials: AlertScope
  researchArticles: AlertScope
  news: AlertScope
  aiInsights: AlertScope
}

export function Alerts() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<AlertPreferences>({
    clinicalTrials: 'all',
    researchArticles: 'all',
    news: 'all',
    aiInsights: 'all',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userCancerType, setUserCancerType] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchPreferences()
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserCancerType(data.user?.cancerType || null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/alerts')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences) {
          setPreferences({
            clinicalTrials: data.preferences.clinicalTrials || 'all',
            researchArticles: data.preferences.researchArticles || 'all',
            news: data.preferences.news || 'all',
            aiInsights: data.preferences.aiInsights || 'all',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching alert preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof AlertPreferences, value: AlertScope) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    setSaving(true)

    try {
      const response = await fetch('/api/user/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: newPreferences }),
      })

      if (!response.ok) {
        // Revert on error
        setPreferences(preferences)
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      // Revert on error
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  const ToggleButton = ({ 
    label, 
    value, 
    onChange, 
    disabled 
  }: { 
    label: string
    value: AlertScope
    onChange: (value: AlertScope) => void
    disabled?: boolean
  }) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-main)] min-w-[100px]">{label}:</span>
        <div className="flex gap-1 bg-[#f1f5ff] rounded-full p-1">
          <button
            onClick={() => onChange('all')}
            disabled={disabled || saving}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              value === 'all'
                ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                : 'text-[var(--brand-blue)] hover:bg-white/50'
            } ${disabled || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            All
          </button>
          <button
            onClick={() => onChange('myType')}
            disabled={disabled || saving || !userCancerType}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              value === 'myType'
                ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                : 'text-[var(--brand-blue)] hover:bg-white/50'
            } ${disabled || saving || !userCancerType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Only My Type
          </button>
          <button
            onClick={() => onChange('none')}
            disabled={disabled || saving}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              value === 'none'
                ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                : 'text-[var(--brand-blue)] hover:bg-white/50'
            } ${disabled || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            None
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">
              <Bell size={14} />
            </div>
            <span>Alerts</span>
          </div>
        </div>
        <div className="widget-subtitle">Choose when to receive email notifications.</div>

        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Loading preferences...
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <ToggleButton
              label="Clinical Trials"
              value={preferences.clinicalTrials}
              onChange={(value) => updatePreference('clinicalTrials', value)}
              disabled={saving}
            />
            <ToggleButton
              label="Research Articles"
              value={preferences.researchArticles}
              onChange={(value) => updatePreference('researchArticles', value)}
              disabled={saving}
            />
            <ToggleButton
              label="News"
              value={preferences.news}
              onChange={(value) => updatePreference('news', value)}
              disabled={saving}
            />
            <ToggleButton
              label="AI Insights"
              value={preferences.aiInsights}
              onChange={(value) => updatePreference('aiInsights', value)}
              disabled={saving}
            />

            {!userCancerType && (
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Set your cancer type in your profile to use "Only My Type" alerts.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

