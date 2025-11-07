'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Newspaper, ExternalLink, Search, X, Loader2 } from 'lucide-react'
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 10

  const fetchArticles = useCallback(async (currentOffset: number = 0, reset: boolean = false) => {
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    try {
      const params = new URLSearchParams({ 
        limit: limit.toString(),
        offset: currentOffset.toString()
      })
      if (activeSearch) {
        params.append('search', activeSearch)
      }
      const response = await fetch(`/api/news?${params.toString()}`)
      const data = await response.json()
      const newArticles = data.articles || []
      
      if (reset) {
        setArticles(newArticles)
      } else {
        setArticles(prev => [...prev, ...newArticles])
      }
      
      // Check if there are more articles to load
      setHasMore(newArticles.length === limit)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeSearch, limit])

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    fetchArticles(0, true)
  }, [fetchArticles])

  const handleLoadMore = () => {
    const newOffset = offset + limit
    setOffset(newOffset)
    fetchArticles(newOffset, false)
  }

  const handleSearch = () => {
    setActiveSearch(searchTerm.trim())
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setActiveSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card className="flex flex-col max-h-[600px]">
      <div className="flex-shrink-0">
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
      <CardContent className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search news by keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} size="sm" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Active Search Indicator */}
        {activeSearch && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
            <span>Searching for: <strong className="text-foreground">{activeSearch}</strong></span>
            <button
              onClick={handleClearSearch}
              className="text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {activeSearch 
              ? `No news articles found matching "${activeSearch}".`
              : 'No news articles available.'}
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
            
            {hasMore && !loading && (
              <div className="pt-4 flex justify-center">
                <Button 
                  onClick={handleLoadMore} 
                  variant="outline" 
                  size="sm"
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Show More'
                  )}
                </Button>
              </div>
            )}
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

