'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExternalLink, ChevronLeft, ChevronRight, Filter, Award } from 'lucide-react'
import { CancerType } from '@/lib/types'
import { formatDate } from '@/lib/utils'

/**
 * Formats indication text to preserve structure and formatting
 */
function formatIndicationText(text: string): React.ReactNode {
  if (!text) return null

  // Split by line breaks and process each line
  const lines = text.split('\n').filter(l => l.trim())
  
  const elements: React.ReactNode[] = []
  let currentList: string[] = []
  let currentParagraph: string[] = []
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 ml-6 mb-2">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground">
              {formatIndicationContent(item)}
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`para-${elements.length}`} className="text-sm text-muted-foreground mb-2">
          {formatIndicationContent(currentParagraph.join(' '))}
        </p>
      )
      currentParagraph = []
    }
  }
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    
    // Check if it's a numbered section header (e.g., "1.1", "1.2")
    const numberedSectionMatch = trimmed.match(/^(\d+\.\d+)\s+(.+)$/)
    if (numberedSectionMatch) {
      flushList()
      flushParagraph()
      const [, number, content] = numberedSectionMatch
      const titleMatch = content.match(/^(.+?):\s*(.+)$/)
      if (titleMatch) {
        const [, title, rest] = titleMatch
        elements.push(
          <div key={`section-${idx}`} className="mb-3">
            <div className="font-semibold text-sm mb-1 text-gray-900">
              {number} {title}:
            </div>
            {rest && (
              <div className="ml-4 text-sm text-muted-foreground">
                {formatIndicationContent(rest)}
              </div>
            )}
          </div>
        )
      } else {
        elements.push(
          <div key={`section-${idx}`} className="font-semibold text-sm mb-2 text-gray-900">
            {number} {content}
          </div>
        )
      }
      return
    }
    
    // Check if it starts with a bullet point
    if (trimmed.match(/^[\*\-\•]\s+/)) {
      flushParagraph()
      const cleanItem = trimmed.replace(/^[\*\-\•]\s+/, '').trim()
      currentList.push(cleanItem)
      return
    }
    
    // Check for "Limitations of Use" or similar special sections
    if (trimmed.match(/^(Limitations of Use|See Clinical Studies)/i)) {
      flushList()
      flushParagraph()
      elements.push(
        <p key={`special-${idx}`} className="text-sm italic text-muted-foreground mb-2">
          <strong>{trimmed}</strong>
        </p>
      )
      return
    }
    
    // Regular text line
    if (trimmed) {
      flushList()
      currentParagraph.push(trimmed)
    } else {
      // Empty line - flush current paragraph
      flushParagraph()
    }
  })
  
  // Flush any remaining content
  flushList()
  flushParagraph()
  
  return <div className="space-y-2">{elements}</div>
}

/**
 * Formats content within a paragraph/section, handling bold text and line breaks
 */
function formatIndicationContent(content: string): React.ReactNode {
  // Split by single line breaks but preserve them
  const lines = content.split('\n').filter(l => l.trim())
  
  return (
    <>
      {lines.map((line, lineIdx) => {
        // Check for bold text patterns (text between asterisks or cancer type names)
        const parts: React.ReactNode[] = []
        let lastIndex = 0
        
        // Pattern for bold text: text between ** or cancer type names
        const boldPattern = /\*\*([^*]+)\*\*|(\b(?:Metastatic|Recurrent|Persistent|Unresectable|Locally advanced|Epithelial|Primary|Hepatocellular|Glioblastoma|Non-small cell|Non-squamous)\s+[A-Za-z\s]+(?:cancer|Carcinoma|Carcinoma|GBM|NSCLC|HCC)?\b)/gi
        let match
        
        while ((match = boldPattern.exec(line)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index))
          }
          
          // Add bold text
          const boldText = match[1] || match[2]
          parts.push(
            <strong key={`bold-${lineIdx}-${match.index}`} className="font-semibold">
              {boldText}
            </strong>
          )
          
          lastIndex = match.index + match[0].length
        }
        
        // Add remaining text
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex))
        }
        
        // If no matches, just return the line
        if (parts.length === 0) {
          parts.push(line)
        }
        
        return (
          <span key={lineIdx}>
            {parts}
            {lineIdx < lines.length - 1 && <br />}
          </span>
        )
      })}
    </>
  )
}

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

interface FdaApproval {
  id: string
  applicationNumber: string | null
  drugName: string
  genericName: string | null
  company: string | null
  approvalDate: Date | null
  cancerTypes: string[]
  indication: string | null
  url: string | null
  labelPdfUrl: string | null
}

interface FdaApprovalsClientProps {
  initialApprovals: FdaApproval[]
  initialTotal: number
  initialPage: number
  initialTotalPages: number
  initialFilters: {
    cancerType?: CancerType
  }
}

export function FdaApprovalsClient({
  initialApprovals,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFilters,
}: FdaApprovalsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [approvals, setApprovals] = useState<FdaApproval[]>(initialApprovals)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{ cancerType?: CancerType }>(initialFilters)

  // Update state when searchParams change (from server component re-render)
  useEffect(() => {
    const cancerTypeParam = searchParams.get('cancerType')
    const page = parseInt(searchParams.get('page') || '1')

    // Validate cancerType is a valid CancerType
    const validCancerType = cancerTypeParam && CANCER_TYPES.some(t => t.value === cancerTypeParam)
      ? (cancerTypeParam as CancerType)
      : undefined

    setFilters({
      cancerType: validCancerType,
    })
    setCurrentPage(page)
    
    // Update approvals, total, and totalPages from new props
    setApprovals(initialApprovals)
    setTotal(initialTotal)
    setTotalPages(initialTotalPages)
  }, [searchParams, initialApprovals, initialTotal, initialTotalPages])

  const limit = 50

  const updateURL = (newFilters: { cancerType?: CancerType }, page: number = 1) => {
    const params = new URLSearchParams()
    if (newFilters.cancerType) params.set('cancerType', newFilters.cancerType)
    if (page > 1) params.set('page', page.toString())

    startTransition(() => {
      router.push(`/fda-approvals?${params.toString()}`)
    })
  }

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const currentFilters = { ...filters }
    updateURL(currentFilters, 1)
  }

  const clearFilters = () => {
    const emptyFilters: { cancerType?: CancerType } = {}
    setFilters(emptyFilters)
    updateURL(emptyFilters, 1)
  }

  const goToPage = (page: number) => {
    updateURL(filters, page)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">FDA Approvals</h1>
        <p className="text-muted-foreground">
          Browse FDA-approved drugs and treatments for cancer
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
            <CardTitle>Filter Approvals</CardTitle>
            <CardDescription>Refine your search results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cancer Type</label>
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
        Showing {approvals.length > 0 ? (currentPage - 1) * limit + 1 : 0} - {Math.min(currentPage * limit, total)} of {total} approvals
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No FDA approvals found. Try adjusting your filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {approvals.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-lg">{approval.drugName}</h3>
                        </div>
                        {approval.genericName && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Generic: {approval.genericName}
                          </p>
                        )}
                        {approval.company && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Manufacturer: {approval.company}
                          </p>
                        )}
                        {approval.approvalDate && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Approved: {formatDate(approval.approvalDate)}
                          </p>
                        )}
                        {approval.applicationNumber && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Application Number: {approval.applicationNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {approval.indication && (
                      <div>
                        <p className="text-sm font-medium mb-2">Indication:</p>
                        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                          {formatIndicationText(approval.indication)}
                        </div>
                      </div>
                    )}

                    {approval.cancerTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {approval.cancerTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                          >
                            {CANCER_TYPE_LABELS[type] || type}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      {approval.url && (
                        <a
                          href={approval.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on FDA website
                        </a>
                      )}
                      {approval.labelPdfUrl && (
                        <a
                          href={approval.labelPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Label (PDF)
                        </a>
                      )}
                    </div>
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

