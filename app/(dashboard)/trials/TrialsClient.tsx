'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExternalLink, ChevronLeft, ChevronRight, Filter, MapPin } from 'lucide-react'
import { CancerType } from '@/lib/types'

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

const TRIAL_STATUSES = [
  { value: 'RECRUITING', label: 'Recruiting' },
  { value: 'NOT_YET_RECRUITING', label: 'Not Yet Recruiting' },
  { value: 'ENROLLING_BY_INVITATION', label: 'Enrolling by Invitation' },
  { value: 'ACTIVE_NOT_RECRUITING', label: 'Active, Not Recruiting' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
]

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
  minimumAge: string | null
  maximumAge: string | null
}

interface TrialsClientProps {
  initialTrials: Trial[]
  initialTotal: number
  initialPage: number
  initialTotalPages: number
  initialFilters: {
    cancerType?: string
    status?: string
  }
}

export function TrialsClient({
  initialTrials,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFilters,
}: TrialsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [trials, setTrials] = useState<Trial[]>(initialTrials)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(initialFilters)

  const limit = 20

  // Update state when searchParams change
  useEffect(() => {
    const cancerType = searchParams.get('cancerType')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')

    setFilters({
      cancerType: cancerType || undefined,
      status: status || undefined,
    })
    setCurrentPage(page)

    // Update trials, total, and totalPages from new props
    setTrials(initialTrials)
    setTotal(initialTotal)
    setTotalPages(initialTotalPages)
  }, [searchParams, initialTrials, initialTotal, initialTotalPages])

  const updateURL = (newFilters: { cancerType?: string; status?: string }, page: number = 1) => {
    const params = new URLSearchParams()
    if (newFilters.cancerType) params.set('cancerType', newFilters.cancerType)
    if (newFilters.status) params.set('status', newFilters.status)
    if (page > 1) params.set('page', page.toString())

    startTransition(() => {
      router.push(`/trials?${params.toString()}`)
    })
  }

  const handleFilterChange = (key: 'cancerType' | 'status', value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }))
  }

  const applyFilters = () => {
    updateURL(filters, 1)
  }

  const clearFilters = () => {
    const emptyFilters: { cancerType?: string; status?: string } = {}
    setFilters(emptyFilters)
    updateURL(emptyFilters, 1)
  }

  const goToPage = (page: number) => {
    updateURL(filters, page)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Clinical Trials</h1>
        <p className="text-muted-foreground">
          View your saved clinical trial matches
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
            <CardTitle>Filter Trials</CardTitle>
            <CardDescription>Refine your search results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cancer Type</Label>
                <Select
                  value={filters.cancerType || 'all'}
                  onValueChange={(value) => handleFilterChange('cancerType', value)}
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
                <Label>Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {TRIAL_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        Showing {trials.length > 0 ? (currentPage - 1) * limit + 1 : 0} - {Math.min(currentPage * limit, total)} of {total} trials
      </div>

      {trials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No trials found. Try searching for trials in the Clinical Trials widget first.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {trials.map((trial) => (
              <Card key={trial.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{trial.title}</h3>
                      {trial.status && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Status: <span className="font-medium">{trial.status}</span>
                        </p>
                      )}
                    </div>

                    {trial.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {trial.description}
                      </p>
                    )}

                    {trial.conditions && trial.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {trial.conditions.map((condition, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    )}

                    {(trial.minimumAge || trial.maximumAge) && (
                      <p className="text-xs text-muted-foreground">
                        Age Range: {trial.minimumAge || 'N/A'} - {trial.maximumAge || 'N/A'}
                      </p>
                    )}

                    {trial.locations && trial.locations.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-start gap-1 mb-1">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">Locations:</span>
                        </div>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
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

                    <a
                      href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on ClinicalTrials.gov
                    </a>
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

