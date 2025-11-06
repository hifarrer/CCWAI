'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ExternalLink, BookOpen } from 'lucide-react'
import { PaperFilters } from '@/lib/types'
import { formatDate } from '@/lib/utils'

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
}

export function NewHopeFinder() {
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<PaperFilters>({
    days: 30,
    limit: 10,
    offset: 0,
  })
  const [viewMode, setViewMode] = useState<'plain' | 'clinical'>('plain')

  const fetchPapers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.cancerType) params.append('cancerType', filters.cancerType)
      if (filters.treatmentType) params.append('treatmentType', filters.treatmentType)
      if (filters.days) params.append('days', filters.days.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/papers?${params.toString()}`)
      const data = await response.json()
      setPapers(data.papers || [])
    } catch (error) {
      console.error('Error fetching papers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPapers()
  }, [filters])

  return (
    <Card className="h-full flex flex-col min-h-[400px]">
      <div className="widget-header cursor-move">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            New Hope Finder
          </CardTitle>
          <CardDescription>
            Latest breakthroughs in cancer research
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cancer-type">Cancer Type</Label>
              <select
                id="cancer-type"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.cancerType || ''}
                onChange={(e) => setFilters({ ...filters, cancerType: e.target.value as any || undefined })}
              >
                <option value="">All Types</option>
                <option value="breast">Breast</option>
                <option value="lung">Lung</option>
                <option value="colorectal">Colorectal</option>
                <option value="prostate">Prostate</option>
                <option value="pancreatic">Pancreatic</option>
              </select>
            </div>
            <div>
              <Label htmlFor="treatment-type">Treatment Type</Label>
              <select
                id="treatment-type"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.treatmentType || ''}
                onChange={(e) => setFilters({ ...filters, treatmentType: e.target.value as any || undefined })}
              >
                <option value="">All Treatments</option>
                <option value="immunotherapy">Immunotherapy</option>
                <option value="chemotherapy">Chemotherapy</option>
                <option value="targeted-therapy">Targeted Therapy</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="days">Last N Days</Label>
            <Input
              id="days"
              type="number"
              value={filters.days || 30}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) || 30 })}
              min={1}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'plain' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('plain')}
            >
              Plain Language
            </Button>
            <Button
              variant={viewMode === 'clinical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('clinical')}
            >
              Clinical
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No papers found. Try adjusting your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <div key={paper.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">{paper.title}</h3>
                {paper.journal && (
                  <p className="text-xs text-muted-foreground">{paper.journal}</p>
                )}
                {paper.publicationDate && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(paper.publicationDate)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {viewMode === 'plain' 
                    ? (paper.summaryPlain || paper.abstract || 'No summary available')
                    : (paper.summaryClinical || paper.abstract || 'No summary available')}
                </p>
                {paper.fullTextUrl && (
                  <a
                    href={paper.fullTextUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Read full paper
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This information is for educational purposes only and does not constitute medical advice. 
            Consult your healthcare provider for personalized medical guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

