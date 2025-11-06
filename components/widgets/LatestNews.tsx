'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Newspaper, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface NewsArticle {
  id: string
  title: string
  content: string | null
  source: string | null
  url: string | null
  publishedAt: Date | null
  summary: string | null
  cancerTypes: string[]
}

export function LatestNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/news?limit=5')
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Latest News
          </CardTitle>
          <CardDescription>
            Recent cancer research news from around the world
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No news articles available.
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">{article.title}</h3>
                {article.source && (
                  <p className="text-xs text-muted-foreground">{article.source}</p>
                )}
                {article.publishedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(article.publishedAt)}
                  </p>
                )}
                {article.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {article.summary}
                  </p>
                )}
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Read article
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This information is for educational purposes only and does not constitute medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

