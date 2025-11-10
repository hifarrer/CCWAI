'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExternalLink, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react'
import { CancerType } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const CANCER_TYPES: { value: CancerType; label: string }[] = [
  { value: 'breast', label: 'Breast Cancer' },
  { value: 'lung', label: 'Lung Cancer' },
  { value: 'colorectal', label: 'Colorectal Cancer' },
  { value: 'prostate', label: 'Prostate Cancer' },
  { value: 'pancreatic', label: 'Pancreatic Cancer' },
  { value: 'liver', label: 'Liver Cancer' },
  { value: 'stomach', label: 'Stomach Cancer' },
  { value: 'esophageal', label: 'Esophageal Cancer' },
  { value: 'bladder', label: 'Bladder Cancer' },
  { value: 'kidney', label: 'Kidney Cancer' },
  { value: 'cervical', label: 'Cervical Cancer' },
  { value: 'ovarian', label: 'Ovarian Cancer' },
  { value: 'leukemia', label: 'Leukemia' },
  { value: 'lymphoma', label: 'Lymphoma' },
  { value: 'melanoma', label: 'Melanoma' },
  { value: 'brain', label: 'Brain Cancer' },
  { value: 'other', label: 'Other' },
]

const CANCER_TYPE_LABELS: Record<string, string> = {
  breast: 'Breast Cancer',
  lung: 'Lung Cancer',
  colorectal: 'Colorectal Cancer',
  prostate: 'Prostate Cancer',
  pancreatic: 'Pancreatic Cancer',
  liver: 'Liver Cancer',
  stomach: 'Stomach Cancer',
  esophageal: 'Esophageal Cancer',
  bladder: 'Bladder Cancer',
  kidney: 'Kidney Cancer',
  cervical: 'Cervical Cancer',
  ovarian: 'Ovarian Cancer',
  leukemia: 'Leukemia',
  lymphoma: 'Lymphoma',
  melanoma: 'Melanoma',
  brain: 'Brain Cancer',
  other: 'Other',
}

interface NewsArticle {
  id: string
  title: string
  content: string | null
  source: string | null
  url: string | null
  publishedAt: Date | null
  summary: string | null
  cancerTypes: string[]
  tags: string[]
}

interface NewsClientProps {
  initialArticles: NewsArticle[]
  initialTotal: number
  initialPage: number
  initialTotalPages: number
  initialFilters: {
    cancerType?: string
    search?: string
  }
  showFallbackMessage: boolean
  userCancerType?: string
}

export function NewsClient({
  initialArticles,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFilters,
  showFallbackMessage,
  userCancerType,
}: NewsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '')

  const limit = 50

  // Update state when searchParams change (from server component re-render)
  useEffect(() => {
    const cancerType = searchParams.get('cancerType')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')

    setFilters({
      cancerType: cancerType || undefined,
      search: search || undefined,
    })
    setSearchTerm(search || '')
    setCurrentPage(page)

    // Update articles, total, and totalPages from new props
    setArticles(initialArticles)
    setTotal(initialTotal)
    setTotalPages(initialTotalPages)
  }, [searchParams, initialArticles, initialTotal, initialTotalPages])

  const updateURL = (newFilters: { cancerType?: string; search?: string }, page: number = 1) => {
    const params = new URLSearchParams()
    if (newFilters.cancerType) params.set('cancerType', newFilters.cancerType)
    if (newFilters.search) params.set('search', newFilters.search)
    if (page > 1) params.set('page', page.toString())

    startTransition(() => {
      router.push(`/news?${params.toString()}`)
    })
  }

  const handleFilterChange = (key: 'cancerType' | 'search', value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    if (key === 'search') {
      setSearchTerm(value || '')
    }
  }

  const applyFilters = () => {
    const currentFilters = { ...filters, search: searchTerm.trim() || undefined }
    updateURL(currentFilters, 1)
  }

  const clearFilters = () => {
    const emptyFilters: { cancerType?: string; search?: string } = {}
    setFilters(emptyFilters)
    setSearchTerm('')
    updateURL(emptyFilters, 1)
  }

  const goToPage = (page: number) => {
    updateURL(filters, page)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cancer News</h1>
        <p className="text-muted-foreground">
          Latest cancer research news and updates from RSS feeds
        </p>
      </div>

      {showFallbackMessage && userCancerType && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-900">
              There are no results available for <strong>{CANCER_TYPE_LABELS[userCancerType] || userCancerType}</strong>. 
              Displaying other cancer-related news...
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter News</CardTitle>
            <CardDescription>Refine your search results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cancerType">Cancer Type</Label>
                <Select
                  value={filters.cancerType || 'all'}
                  onValueChange={(value) => handleFilterChange('cancerType', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All cancer types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cancer types</SelectItem>
                    {CANCER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">Search Keywords</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search in title, content..."
                    value={searchTerm}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-9 pr-9"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        handleFilterChange('search', '')
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters} disabled={isPending}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters} disabled={isPending}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 text-sm text-muted-foreground">
        Showing {articles.length > 0 ? (currentPage - 1) * limit + 1 : 0} - {Math.min(currentPage * limit, total)} of {total} articles
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No news articles found. Try adjusting your filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                      {article.source && (
                        <p className="text-sm text-muted-foreground mb-1">{article.source}</p>
                      )}
                      {article.publishedAt && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Published: {formatDate(article.publishedAt)}
                        </p>
                      )}
                    </div>

                    {article.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.summary}
                      </p>
                    )}

                    {article.cancerTypes && article.cancerTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {article.cancerTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Read full article
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <div className="mt-8 pt-6 border-t text-xs text-muted-foreground">
        <p className="italic">
          This information is for educational purposes only and does not constitute medical advice.
          Consult your healthcare provider for personalized medical guidance.
        </p>
      </div>
    </div>
  )
}

