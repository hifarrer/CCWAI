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
import { ExternalLink, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { PaperFilters, CancerType, TreatmentType } from '@/lib/types'
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

const TREATMENT_TYPES: { value: TreatmentType; label: string }[] = [
  { value: 'chemotherapy', label: 'Chemotherapy' },
  { value: 'immunotherapy', label: 'Immunotherapy' },
  { value: 'radiation', label: 'Radiation' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'targeted-therapy', label: 'Targeted Therapy' },
  { value: 'hormone-therapy', label: 'Hormone Therapy' },
  { value: 'stem-cell-transplant', label: 'Stem Cell Transplant' },
  { value: 'other', label: 'Other' },
]

interface ResearchPaper {
  id: string
  title: string
  abstract: string | null
  summaryPlain: string | null
  summaryClinical: string | null
  journal: string | null
  publicationDate: Date | null
  authors: string[]
  cancerTypes: string[]
  treatmentTypes: string[]
  fullTextUrl: string | null
  pubmedId: string
}

interface ArticlesClientProps {
  initialPapers: ResearchPaper[]
  initialTotal: number
  initialPage: number
  initialTotalPages: number
  initialFilters: PaperFilters
}

export function ArticlesClient({
  initialPapers,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFilters,
}: ArticlesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [papers, setPapers] = useState<ResearchPaper[]>(initialPapers)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<PaperFilters>(initialFilters)

  // Update state when searchParams change (from server component re-render)
  useEffect(() => {
    const cancerType = searchParams.get('cancerType')
    const treatmentType = searchParams.get('treatmentType')
    const days = searchParams.get('days')
    const page = parseInt(searchParams.get('page') || '1')

    setFilters({
      cancerType: cancerType || undefined,
      treatmentType: treatmentType || undefined,
      days: days ? parseInt(days) : undefined,
    })
    setCurrentPage(page)
    
    // Update papers, total, and totalPages from new props
    setPapers(initialPapers)
    setTotal(initialTotal)
    setTotalPages(initialTotalPages)
  }, [searchParams, initialPapers, initialTotal, initialTotalPages])

  const limit = 50

  const updateURL = (newFilters: PaperFilters, page: number = 1) => {
    const params = new URLSearchParams()
    if (newFilters.cancerType) params.set('cancerType', newFilters.cancerType)
    if (newFilters.treatmentType) params.set('treatmentType', newFilters.treatmentType)
    if (newFilters.days) params.set('days', newFilters.days.toString())
    if (page > 1) params.set('page', page.toString())

    startTransition(() => {
      router.push(`/articles?${params.toString()}`)
    })
  }

  const handleFilterChange = (key: keyof PaperFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    // Use the current filters state
    const currentFilters = { ...filters }
    updateURL(currentFilters, 1)
  }

  const clearFilters = () => {
    const emptyFilters: PaperFilters = {}
    setFilters(emptyFilters)
    updateURL(emptyFilters, 1)
  }

  const goToPage = (page: number) => {
    updateURL(filters, page)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Research Articles</h1>
        <p className="text-muted-foreground">
          Browse research papers and articles related to your cancer type
        </p>
      </div>

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
            <CardTitle>Filter Articles</CardTitle>
            <CardDescription>Refine your search results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="treatmentType">Treatment Type</Label>
                <Select
                  value={filters.treatmentType || 'all'}
                  onValueChange={(value) => handleFilterChange('treatmentType', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All treatment types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All treatment types</SelectItem>
                    {TREATMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="days">Published in last (days)</Label>
                <Input
                  id="days"
                  type="number"
                  placeholder="All time"
                  value={filters.days || ''}
                  onChange={(e) => handleFilterChange('days', e.target.value ? parseInt(e.target.value) : undefined)}
                />
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
        Showing {papers.length > 0 ? (currentPage - 1) * limit + 1 : 0} - {Math.min(currentPage * limit, total)} of {total} articles
      </div>

      {papers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No articles found. Try adjusting your filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {papers.map((paper) => (
              <Card key={paper.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{paper.title}</h3>
                      {paper.journal && (
                        <p className="text-sm text-muted-foreground mb-1">{paper.journal}</p>
                      )}
                      {paper.publicationDate && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Published: {formatDate(paper.publicationDate)}
                        </p>
                      )}
                      {paper.authors && paper.authors.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Authors: {paper.authors.slice(0, 5).join(', ')}
                          {paper.authors.length > 5 && ` and ${paper.authors.length - 5} more`}
                        </p>
                      )}
                    </div>

                    {paper.abstract && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {paper.abstract}
                      </p>
                    )}

                    {(paper.cancerTypes.length > 0 || paper.treatmentTypes.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {paper.cancerTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                          >
                            {type}
                          </span>
                        ))}
                        {paper.treatmentTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    {paper.fullTextUrl && (
                      <a
                        href={paper.fullTextUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Read full paper on PubMed
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

