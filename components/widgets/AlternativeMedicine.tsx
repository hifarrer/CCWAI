'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlaskConical, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AltMedicineResearch {
  id: string
  title: string
  description: string | null
  source: string | null
  url: string | null
  evidenceLevel: string | null
  publishedAt: Date | null
  summary: string | null
  cancerTypes: string[]
}

export function AlternativeMedicine() {
  const [articles, setArticles] = useState<AltMedicineResearch[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alt-medicine?limit=5')
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Error fetching alt medicine:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEvidenceBadge = (level: string | null) => {
    if (!level) return null
    const colors: Record<string, string> = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[level.toLowerCase()] || colors.low}`}>
        Evidence: {level}
      </span>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Alternative Medicine
          </CardTitle>
          <CardDescription>
            Research on complementary and alternative treatments
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800">
            Always discuss alternative medicine options with your healthcare provider before trying any new treatment.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alternative medicine research available.
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm flex-1">{article.title}</h3>
                  {getEvidenceBadge(article.evidenceLevel)}
                </div>
                {article.source && (
                  <p className="text-xs text-muted-foreground">Source: {article.source}</p>
                )}
                {article.publishedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(article.publishedAt)}
                  </p>
                )}
                {(article.summary || article.description) && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {article.summary || article.description}
                  </p>
                )}
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Read more
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This information is for educational purposes only. Always consult your healthcare provider 
            before starting any alternative treatment.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

