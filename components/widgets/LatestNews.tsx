'use client'

import { useState, useEffect, useCallback } from 'react'
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
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">📰</div>
            <span>Latest News</span>
          </div>
        </div>
        <div className="widget-subtitle">Recent cancer research news from around the world.</div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {activeSearch 
              ? `No news articles found matching "${activeSearch}".`
              : 'No news articles available.'}
          </div>
        ) : (
          <>
            <ul className="list" style={{ flex: 1, minHeight: 0 }}>
              {articles.map((article) => (
                <li key={article.id}>
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <span className="list-item-title">{article.title}</span>
                      <div className="list-item-meta">
                        {article.source && `${article.source} · `}
                        {article.publishedAt && formatDate(article.publishedAt)}
                      </div>
                    </a>
                  ) : (
                    <>
                      <span className="list-item-title">{article.title}</span>
                      <div className="list-item-meta">
                        {article.source && `${article.source} · `}
                        {article.publishedAt && formatDate(article.publishedAt)}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-secondary mt-2"
                style={{ alignSelf: 'center', width: 'auto', minWidth: '120px' }}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

