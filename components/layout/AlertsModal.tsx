'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Bell, ExternalLink, X } from 'lucide-react'
import { format } from 'date-fns'

interface Alert {
  id: string
  alertType: string
  recordId: string
  recordType: string
  sentAt: string
  article: {
    id: string
    title: string
    summary?: string | null
    source?: string | null
    publishedAt?: string | null
    authors?: string[]
    cancerTypes?: string[]
  } | null
  url?: string | null
}

interface AlertsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAlertsUpdated?: () => void
}

export function AlertsModal({ open, onOpenChange, onAlertsUpdated }: AlertsModalProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAlerts()
    }
  }, [open])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/alerts/notifications')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertIds: string[]) => {
    try {
      setMarkingRead(true)
      const response = await fetch('/api/user/alerts/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds }),
      })

      if (response.ok) {
        // Remove marked alerts from the list
        setAlerts((prev) => prev.filter((alert) => !alertIds.includes(alert.id)))
        // Notify parent to refresh count
        if (onAlertsUpdated) {
          onAlertsUpdated()
        }
      }
    } catch (error) {
      console.error('Error marking alerts as read:', error)
    } finally {
      setMarkingRead(false)
    }
  }

  const handleAlertClick = (alert: Alert) => {
    // Mark this alert as read
    markAsRead([alert.id])

    // Open the article URL if available
    if (alert.url) {
      window.open(alert.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleMarkAllRead = () => {
    const allIds = alerts.map((alert) => alert.id)
    if (allIds.length > 0) {
      markAsRead(allIds)
    }
  }

  const getAlertTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      researchArticles: 'Research Article',
      news: 'News',
      clinicalTrials: 'Clinical Trial',
      aiInsights: 'AI Insight',
      potentialCures: 'Potential Cure',
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="widget-pill pill-blue">
                <Bell size={14} />
              </div>
              <DialogTitle className="text-xl">Alerts</DialogTitle>
            </div>
            {alerts.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="text-sm text-[var(--brand-blue)] hover:underline disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>
          <DialogDescription>
            {alerts.length === 0
              ? 'You have no new alerts'
              : `You have ${alerts.length} new ${alerts.length === 1 ? 'alert' : 'alerts'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No new alerts</p>
              <p className="text-sm mt-2">
                You'll be notified when new articles match your preferences.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-[var(--border-soft)] rounded-[18px] p-4 hover:bg-[#f5f8ff] transition-colors cursor-pointer"
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(77,181,255,0.1)] text-[var(--brand-blue)] font-semibold">
                          {getAlertTypeLabel(alert.alertType)}
                        </span>
                        {alert.article?.cancerTypes &&
                          alert.article.cancerTypes.length > 0 && (
                            <span className="text-xs text-[var(--text-muted)]">
                              {alert.article.cancerTypes.join(', ')}
                            </span>
                          )}
                      </div>
                      <h3 className="font-semibold text-[var(--text-main)] mb-1 line-clamp-2">
                        {alert.article?.title || 'Untitled'}
                      </h3>
                      {alert.article?.summary && (
                        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
                          {alert.article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        {alert.article?.source && (
                          <span>{alert.article.source}</span>
                        )}
                        {formatDate(alert.sentAt) && (
                          <span>• {formatDate(alert.sentAt)}</span>
                        )}
                        {alert.url && (
                          <span className="flex items-center gap-1 text-[var(--brand-blue)] hover:underline">
                            <ExternalLink size={12} />
                            View
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

