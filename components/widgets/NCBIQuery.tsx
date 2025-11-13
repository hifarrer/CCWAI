'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import { CancerType } from '@/lib/types'

type DatabaseType = 'pubmed' | 'protein' | 'nucleotide' | 'gene' | 'snp' | 'structure' | 'taxonomy'
type QueryType = 'esearch' | 'esummary' | 'efetch'
type PublicationDate = 'all' | '1year' | '2years' | '5years' | '10years'
type ArticleType = 
  | 'all'
  | 'abstracts'
  | 'blog'
  | 'classical-article'
  | 'clinical-conference'
  | 'clinical-study'
  | 'clinical-trial'
  | 'clinical-trial-protocol'
  | 'clinical-trial-phase-i'
  | 'clinical-trial-phase-ii'
  | 'clinical-trial-phase-iii'
  | 'clinical-trial-phase-iv'
  | 'clinical-trial-veterinary'
  | 'comparative-study'
  | 'congress'
  | 'consensus-development-conference'
  | 'consensus-development-conference-nih'
  | 'controlled-clinical-trial'
  | 'corrected-and-republished-article'
  | 'database'
  | 'dataset'
  | 'editorial'
  | 'english-abstract'
  | 'essay'
  | 'evaluation-study'
  | 'examination-questions'
  | 'exhibition'
  | 'expression-of-concern'
  | 'government-publication'
  | 'graphic-novel'
  | 'interview'
  | 'journal-article'
  | 'lecture'
  | 'news'
  | 'observational-study'
  | 'patent'
  | 'research-support-arra'
  | 'research-support-nih-extramural'
  | 'research-support-nih-intramural'
  | 'research-support-non-us-govt'
  | 'research-support-us-govt-non-phs'
  | 'research-support-us-govt-phs'
  | 'research-support-us-government'
  | 'statistics'
  | 'study-characteristics'
  | 'support-of-research'
  | 'review'
  | 'case-report'
  | 'meta-analysis'

const CANCER_TYPE_OPTIONS: { value: CancerType | 'custom'; label: string }[] = [
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
  { value: 'custom', label: 'Custom / Other' },
]


interface SearchResult {
  idList?: string[]
  count?: string
  translationSet?: any
  queryTranslation?: string
}

interface SummaryResult {
  uids?: string[]
  [key: string]: any
}

interface FetchResult {
  [key: string]: any
}

export function NCBIQuery() {
  const [database, setDatabase] = useState<DatabaseType>('pubmed')
  const [queryType, setQueryType] = useState<QueryType>('esearch')
  
  // Query builder fields (for PubMed)
  const [cancerType, setCancerType] = useState<CancerType | 'custom' | 'none'>('none')
  const [customCancerType, setCustomCancerType] = useState('')
  const [additionalTerms, setAdditionalTerms] = useState('')
  const [publicationDate, setPublicationDate] = useState<PublicationDate>('all')
  const [articleType, setArticleType] = useState<ArticleType>('all')
  
  // Query term (can be auto-generated or manually edited)
  const [queryTerm, setQueryTerm] = useState('')
  const [isManuallyEdited, setIsManuallyEdited] = useState(false)
  
  const [ids, setIds] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build query from builder fields (only for PubMed and ESearch)
  useEffect(() => {
    if (database === 'pubmed' && queryType === 'esearch' && !isManuallyEdited) {
      buildQuery()
    }
  }, [cancerType, customCancerType, additionalTerms, publicationDate, articleType, database, queryType, isManuallyEdited])

  const buildQuery = () => {
    if (database !== 'pubmed' || queryType !== 'esearch') return

    const parts: string[] = []

    // Cancer type
    if (cancerType && cancerType !== 'none') {
      if (cancerType === 'custom') {
        // Custom cancer type
        if (customCancerType.trim()) {
          parts.push(customCancerType.trim())
        }
      } else {
        // Predefined cancer type
        const cancerTerm = formatCancerTerm(cancerType)
        parts.push(cancerTerm)
      }
    }

    // Additional terms
    if (additionalTerms.trim()) {
      const terms = additionalTerms.trim().split(/\s+/)
      parts.push(...terms)
    }

    // Publication date filter
    if (publicationDate !== 'all') {
      const dateFilter = getDateFilter(publicationDate)
      if (dateFilter) {
        parts.push(dateFilter)
      }
    }

    // Article type filter
    if (articleType !== 'all') {
      const articleTypeFilter = getArticleTypeFilter(articleType)
      if (articleTypeFilter) {
        parts.push(articleTypeFilter)
      }
    }

    // Always filter for articles with abstracts (PubMed only)
    if (database === 'pubmed') {
      parts.push('hasabstract[text]')
    }

    // Combine with AND
    const query = parts.length > 0 ? parts.join(' AND ') : ''
    setQueryTerm(query)
  }

  // Handle manual query editing
  const handleQueryChange = (value: string) => {
    setQueryTerm(value)
    if (database === 'pubmed' && queryType === 'esearch') {
      setIsManuallyEdited(true)
    }
  }

  const formatCancerTerm = (type: CancerType): string => {
    const cancerNames: Record<CancerType, string> = {
      breast: 'breast cancer',
      lung: 'lung cancer',
      colorectal: 'colorectal cancer',
      prostate: 'prostate cancer',
      pancreatic: 'pancreatic cancer',
      liver: 'liver cancer',
      stomach: 'stomach cancer',
      esophageal: 'esophageal cancer',
      bladder: 'bladder cancer',
      kidney: 'kidney cancer',
      cervical: 'cervical cancer',
      ovarian: 'ovarian cancer',
      leukemia: 'leukemia',
      lymphoma: 'lymphoma',
      melanoma: 'melanoma',
      brain: 'brain cancer',
      other: 'cancer',
    }
    return cancerNames[type] || 'cancer'
  }


  const getDateFilter = (dateRange: PublicationDate): string | null => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}/${month}/${day}`

    switch (dateRange) {
      case '1year':
        return `${year - 1}:${year}[Publication Date]`
      case '2years':
        return `${year - 2}:${year}[Publication Date]`
      case '5years':
        return `${year - 5}:${year}[Publication Date]`
      case '10years':
        return `${year - 10}:${year}[Publication Date]`
      default:
        return null
    }
  }

  const getArticleTypeFilter = (type: ArticleType): string | null => {
    const typeMap: Record<ArticleType, string | null> = {
      'all': null,
      'abstracts': '"Abstracts"[Publication Type]',
      'blog': '"Blog"[Publication Type]',
      'classical-article': '"Classical Article"[Publication Type]',
      'clinical-conference': '"Clinical Conference"[Publication Type]',
      'clinical-study': '"Clinical Study"[Publication Type]',
      'clinical-trial': '"Clinical Trial"[Publication Type]',
      'clinical-trial-protocol': '"Clinical Trial Protocol"[Publication Type]',
      'clinical-trial-phase-i': '"Clinical Trial, Phase I"[Publication Type]',
      'clinical-trial-phase-ii': '"Clinical Trial, Phase II"[Publication Type]',
      'clinical-trial-phase-iii': '"Clinical Trial, Phase III"[Publication Type]',
      'clinical-trial-phase-iv': '"Clinical Trial, Phase IV"[Publication Type]',
      'clinical-trial-veterinary': '"Clinical Trial, Veterinary"[Publication Type]',
      'comparative-study': '"Comparative Study"[Publication Type]',
      'congress': '"Congress"[Publication Type]',
      'consensus-development-conference': '"Consensus Development Conference"[Publication Type]',
      'consensus-development-conference-nih': '"Consensus Development Conference, NIH"[Publication Type]',
      'controlled-clinical-trial': '"Controlled Clinical Trial"[Publication Type]',
      'corrected-and-republished-article': '"Corrected and Republished Article"[Publication Type]',
      'database': '"Database"[Publication Type]',
      'dataset': '"Dataset"[Publication Type]',
      'editorial': '"Editorial"[Publication Type]',
      'english-abstract': '"English Abstract"[Publication Type]',
      'essay': '"Essay"[Publication Type]',
      'evaluation-study': '"Evaluation Study"[Publication Type]',
      'examination-questions': '"Examination Questions"[Publication Type]',
      'exhibition': '"Exhibition"[Publication Type]',
      'expression-of-concern': '"Expression of Concern"[Publication Type]',
      'government-publication': '"Government Publication"[Publication Type]',
      'graphic-novel': '"Graphic Novel"[Publication Type]',
      'interview': '"Interview"[Publication Type]',
      'journal-article': '"Journal Article"[Publication Type]',
      'lecture': '"Lecture"[Publication Type]',
      'news': '"News"[Publication Type]',
      'observational-study': '"Observational Study"[Publication Type]',
      'patent': '"Patent"[Publication Type]',
      'research-support-arra': '"Research Support, American Recovery and Reinvestment Act"[Publication Type]',
      'research-support-nih-extramural': '"Research Support, N.I.H., Extramural"[Publication Type]',
      'research-support-nih-intramural': '"Research Support, N.I.H., Intramural"[Publication Type]',
      'research-support-non-us-govt': '"Research Support, Non-U.S. Gov\'t"[Publication Type]',
      'research-support-us-govt-non-phs': '"Research Support, U.S. Gov\'t, Non-P.H.S."[Publication Type]',
      'research-support-us-govt-phs': '"Research Support, U.S. Gov\'t, P.H.S."[Publication Type]',
      'research-support-us-government': '"Research Support, U.S. Government"[Publication Type]',
      'statistics': '"Statistics"[Publication Type]',
      'study-characteristics': '"Study Characteristics"[Publication Type]',
      'support-of-research': '"Support of Research"[Publication Type]',
      'review': '"Review"[Publication Type]',
      'case-report': '"Case Reports"[Publication Type]',
      'meta-analysis': '"Meta-Analysis"[Publication Type]',
    }
    return typeMap[type] || null
  }

  // Reset manual edit flag when database or query type changes
  useEffect(() => {
    setIsManuallyEdited(false)
    if (database !== 'pubmed' || queryType !== 'esearch') {
      setQueryTerm('')
    }
  }, [database, queryType])

  const handleSearch = async () => {
    if (!queryTerm.trim() && queryType !== 'esummary' && queryType !== 'efetch') {
      setError('Please enter a search query')
      return
    }

    if ((queryType === 'esummary' || queryType === 'efetch') && !ids.trim()) {
      setError('Please enter IDs (comma-separated)')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const params = new URLSearchParams({
        database,
        queryType,
        ...(queryType === 'esearch' ? { term: queryTerm } : { ids: ids.trim() }),
      })

      const response = await fetch(`/api/ncbi?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to query NCBI')
      }

      let result = data.result

      // If ESearch returned IDs, fetch summaries to get titles/info (for databases that support ESummary)
      const databasesWithSummary = ['pubmed', 'protein', 'nucleotide', 'gene', 'snp', 'structure', 'taxonomy']
      if (queryType === 'esearch' && databasesWithSummary.includes(database) && (result.idlist || result.idList)) {
        const idList = result.idlist || result.idList
        if (idList && idList.length > 0) {
          // Fetch summaries for the first 50 IDs (to avoid too many requests)
          const idsToFetch = idList.slice(0, 50).join(',')
          try {
            const summaryParams = new URLSearchParams({
              database,
              queryType: 'esummary',
              ids: idsToFetch,
            })
            const summaryResponse = await fetch(`/api/ncbi?${summaryParams.toString()}`)
            const summaryData = await summaryResponse.json()
            
            if (summaryResponse.ok && summaryData.result) {
              // Attach summaries to result
              result.summaries = summaryData.result
            }
          } catch (summaryErr) {
            // If summary fetch fails, continue without titles
            console.warn('Failed to fetch summaries:', summaryErr)
          }
        }
      }

      setResults(result)
    } catch (err: any) {
      setError(err.message || 'An error occurred while querying NCBI')
      console.error('NCBI query error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getResultCount = () => {
    if (!results) return null
    if (queryType === 'esearch' && (results.idlist || results.idList)) {
      const idList = results.idlist || results.idList
      return results.count || idList.length
    }
    if (queryType === 'esummary' && results.uids) {
      return results.uids.length
    }
    return null
  }

  const getNCBIUrl = (id: string, db: DatabaseType): string => {
    const urlMap: Record<DatabaseType, string> = {
      pubmed: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      nucleotide: `https://www.ncbi.nlm.nih.gov/nuccore/${id}`,
      protein: `https://www.ncbi.nlm.nih.gov/protein/${id}`,
      gene: `https://www.ncbi.nlm.nih.gov/gene/${id}`,
      snp: `https://www.ncbi.nlm.nih.gov/snp/${id}`,
      structure: `https://www.ncbi.nlm.nih.gov/structure/${id}`,
      taxonomy: `https://www.ncbi.nlm.nih.gov/taxonomy/${id}`,
    }
    return urlMap[db] || `https://www.ncbi.nlm.nih.gov/${db}/${id}`
  }

  // Parse publication date from NCBI format for sorting
  const parsePublicationDate = (pubdate: string | undefined): Date => {
    if (!pubdate) return new Date(0) // Return epoch for missing dates
    
    // NCBI dates can be in formats like "2024 Jan 1", "2024", "2024/01/01", etc.
    try {
      // Try to parse as-is first
      const parsed = new Date(pubdate)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
      
      // Try to extract year if full date parsing fails
      const yearMatch = pubdate.match(/\d{4}/)
      if (yearMatch) {
        return new Date(parseInt(yearMatch[0]), 0, 1)
      }
      
      return new Date(0)
    } catch {
      return new Date(0)
    }
  }

  // Format publication date for display
  const formatPublicationDate = (pubdate: string | undefined): string => {
    if (!pubdate) return 'Date not available'
    return pubdate
  }

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">🔬</div>
            <span>NCBI Query</span>
          </div>
        </div>
        <div className="widget-subtitle">Search and retrieve information from NCBI databases.</div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Select value={database} onValueChange={(value) => setDatabase(value as DatabaseType)}>
              <SelectTrigger id="database">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pubmed">PubMed</SelectItem>
                <SelectItem value="protein">Protein</SelectItem>
                <SelectItem value="nucleotide">Nucleotide</SelectItem>
                <SelectItem value="gene">Gene</SelectItem>
                <SelectItem value="snp">SNP</SelectItem>
                <SelectItem value="structure">Structure</SelectItem>
                <SelectItem value="taxonomy">Taxonomy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queryType">Query Type</Label>
            <Select value={queryType} onValueChange={(value) => setQueryType(value as QueryType)}>
              <SelectTrigger id="queryType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esearch">ESearch - Search</SelectItem>
                <SelectItem value="esummary">ESummary - Get Summaries</SelectItem>
                <SelectItem value="efetch">EFetch - Get Full Records</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {queryType === 'esearch' && database === 'pubmed' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="cancerType">Cancer Type</Label>
                <Select 
                  value={cancerType} 
                  onValueChange={(value) => setCancerType(value as CancerType | 'custom' | 'none')}
                >
                  <SelectTrigger id="cancerType">
                    <SelectValue placeholder="Select cancer type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCER_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cancerType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customCancer">Custom Cancer Type</Label>
                  <Input
                    id="customCancer"
                    placeholder="e.g., thyroid cancer, sarcoma"
                    value={customCancerType}
                    onChange={(e) => setCustomCancerType(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalTerms">Additional Keywords (Optional)</Label>
                <Input
                  id="additionalTerms"
                  placeholder="e.g., mutation, biomarker, prognosis"
                  value={additionalTerms}
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple terms with spaces
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicationDate">Publication Date</Label>
                <Select 
                  value={publicationDate} 
                  onValueChange={(value) => setPublicationDate(value as PublicationDate)}
                >
                  <SelectTrigger id="publicationDate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="2years">Last 2 Years</SelectItem>
                    <SelectItem value="5years">Last 5 Years</SelectItem>
                    <SelectItem value="10years">Last 10 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="articleType">Article Type</Label>
                <Select 
                  value={articleType} 
                  onValueChange={(value) => setArticleType(value as ArticleType)}
                >
                  <SelectTrigger id="articleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="abstracts">Abstracts</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="classical-article">Classical Article</SelectItem>
                    <SelectItem value="clinical-conference">Clinical Conference</SelectItem>
                    <SelectItem value="clinical-study">Clinical Study</SelectItem>
                    <SelectItem value="clinical-trial">Clinical Trial</SelectItem>
                    <SelectItem value="clinical-trial-protocol">Clinical Trial Protocol</SelectItem>
                    <SelectItem value="clinical-trial-phase-i">Clinical Trial, Phase I</SelectItem>
                    <SelectItem value="clinical-trial-phase-ii">Clinical Trial, Phase II</SelectItem>
                    <SelectItem value="clinical-trial-phase-iii">Clinical Trial, Phase III</SelectItem>
                    <SelectItem value="clinical-trial-phase-iv">Clinical Trial, Phase IV</SelectItem>
                    <SelectItem value="clinical-trial-veterinary">Clinical Trial, Veterinary</SelectItem>
                    <SelectItem value="comparative-study">Comparative Study</SelectItem>
                    <SelectItem value="congress">Congress</SelectItem>
                    <SelectItem value="consensus-development-conference">Consensus Development Conference</SelectItem>
                    <SelectItem value="consensus-development-conference-nih">Consensus Development Conference, NIH</SelectItem>
                    <SelectItem value="controlled-clinical-trial">Controlled Clinical Trial</SelectItem>
                    <SelectItem value="corrected-and-republished-article">Corrected and Republished Article</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="dataset">Dataset</SelectItem>
                    <SelectItem value="editorial">Editorial</SelectItem>
                    <SelectItem value="english-abstract">English Abstract</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="evaluation-study">Evaluation Study</SelectItem>
                    <SelectItem value="examination-questions">Examination Questions</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                    <SelectItem value="expression-of-concern">Expression of Concern</SelectItem>
                    <SelectItem value="government-publication">Government Publication</SelectItem>
                    <SelectItem value="graphic-novel">Graphic Novel</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="journal-article">Journal Article</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="observational-study">Observational Study</SelectItem>
                    <SelectItem value="patent">Patent</SelectItem>
                    <SelectItem value="research-support-arra">Research Support, American Recovery and Reinvestment Act</SelectItem>
                    <SelectItem value="research-support-nih-extramural">Research Support, N.I.H., Extramural</SelectItem>
                    <SelectItem value="research-support-nih-intramural">Research Support, N.I.H., Intramural</SelectItem>
                    <SelectItem value="research-support-non-us-govt">Research Support, Non-U.S. Gov't</SelectItem>
                    <SelectItem value="research-support-us-govt-non-phs">Research Support, U.S. Gov't, Non-P.H.S.</SelectItem>
                    <SelectItem value="research-support-us-govt-phs">Research Support, U.S. Gov't, P.H.S.</SelectItem>
                    <SelectItem value="research-support-us-government">Research Support, U.S. Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="queryTerm">Search Query</Label>
                <Input
                  id="queryTerm"
                  placeholder="Query will be generated from options above, or type manually..."
                  value={queryTerm}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <p className="text-xs text-muted-foreground">
                  The query is automatically generated from the options above, but you can edit it manually if needed.
                </p>
              </div>
            </div>
          )}

          {queryType === 'esearch' && database !== 'pubmed' && (
            <div className="space-y-2">
              <Label htmlFor="queryTerm">Search Query</Label>
              <Input
                id="queryTerm"
                placeholder="e.g., cancer[title] AND immunotherapy[abstract]"
                value={queryTerm}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <p className="text-xs text-muted-foreground">
                Use Entrez query syntax. Examples: "cancer[title]", "gene[field] AND mutation[field]"
              </p>
            </div>
          )}

          {(queryType === 'esummary' || queryType === 'efetch') && (
            <div className="space-y-2">
              <Label htmlFor="ids">IDs (comma-separated)</Label>
              <Input
                id="ids"
                placeholder="e.g., 12345678, 23456789"
                value={ids}
                onChange={(e) => setIds(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <p className="text-xs text-muted-foreground">
                Enter comma-separated IDs for the selected database
              </p>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || (queryType === 'esearch' && !queryTerm.trim()) || ((queryType === 'esummary' || queryType === 'efetch') && !ids.trim())}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Querying...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {results && (
          <div className="flex-1 overflow-y-auto space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Results</h3>
              {getResultCount() !== null && (
                <span className="text-xs text-muted-foreground">
                  {getResultCount()} result{getResultCount() !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {queryType === 'esearch' && (
              <div className="space-y-2">
                {(results.querytranslation || results.queryTranslation) && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-medium mb-1">Query Translation:</p>
                    <p className="text-xs text-muted-foreground">
                      {results.querytranslation || results.queryTranslation}
                    </p>
                  </div>
                )}
                {(results.idlist || results.idList) && (results.idlist || results.idList).length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Found Publications:</p>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {(() => {
                        // Get all IDs
                        const allIds = results.idlist || results.idList
                        
                        // Sort IDs by publication date (newest first) - primarily for PubMed
                        const sortedIds = [...allIds].sort((a, b) => {
                          if (results.summaries) {
                            const summaryA = results.summaries[a]
                            const summaryB = results.summaries[b]
                            const dateA = parsePublicationDate(summaryA?.pubdate || summaryA?.pd || summaryA?.createdate)
                            const dateB = parsePublicationDate(summaryB?.pubdate || summaryB?.pd || summaryB?.createdate)
                            
                            // If both have dates, sort by date (newest first)
                            if (dateA.getTime() > 0 && dateB.getTime() > 0) {
                              return dateB.getTime() - dateA.getTime() // Descending order
                            }
                            // Items with dates come before items without dates
                            if (dateA.getTime() > 0) return -1
                            if (dateB.getTime() > 0) return 1
                            // Both have no date, maintain original order
                            return 0
                          }
                          return 0 // No sorting if no summaries
                        })
                        
                        // Take first 50
                        return sortedIds.slice(0, 50).map((id: string) => {
                          // Get title/name and date from summaries if available
                          const summary = results.summaries?.[id] || null
                          
                          // Extract title from various possible fields (different databases use different fields)
                          let title: string | null = null
                          if (summary) {
                            // Try multiple field names that different NCBI databases use
                            title = summary.title || 
                                    summary.title2 || 
                                    summary.caption || 
                                    summary.name || 
                                    summary.description ||
                                    summary.definition ||
                                    summary.scientificname ||
                                    summary.organism?.scientificname ||
                                    summary.organism?.name ||
                                    summary.extra?.title ||
                                    summary.extra?.caption ||
                                    (typeof summary.extra === 'string' ? summary.extra : null) ||
                                    null
                            
                            // If still no title, try to get from the first non-empty string field
                            if (!title) {
                              for (const [key, value] of Object.entries(summary)) {
                                if (typeof value === 'string' && value.trim().length > 0 && 
                                    !['uid', 'gi', 'accessionversion'].includes(key.toLowerCase())) {
                                  title = value
                                  break
                                }
                              }
                            }
                          }
                          
                          const pubdate = summary?.pubdate || summary?.pd || summary?.createdate || summary?.updatedate || null
                          const truncatedTitle = title 
                            ? (title.length > 50 ? title.substring(0, 50).trim() + '...' : title)
                            : null

                          return (
                            <div key={id} className="bg-gray-50 rounded p-3 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {truncatedTitle ? (
                                    <p className="text-xs font-medium text-gray-900">
                                      {truncatedTitle}
                                    </p>
                                  ) : results.summaries && results.summaries[id] ? (
                                    <p className="text-xs font-medium text-gray-900">
                                      {database.charAt(0).toUpperCase() + database.slice(1)} Record {id}
                                    </p>
                                  ) : results.summaries ? (
                                    <p className="text-xs font-medium text-gray-500 italic">
                                      Loading information...
                                    </p>
                                  ) : (
                                    <p className="text-xs font-medium text-gray-900">
                                      {database.charAt(0).toUpperCase() + database.slice(1)} Record {id}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {pubdate && (
                                      <p className="text-xs text-muted-foreground">
                                        {formatPublicationDate(pubdate)}
                                      </p>
                                    )}
                                    {truncatedTitle && (
                                      <p className="text-xs text-muted-foreground font-mono">
                                        ID: {id}
                                      </p>
                                    )}
                                    {!truncatedTitle && !pubdate && (
                                      <p className="text-xs text-muted-foreground font-mono">
                                        ID: {id}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href={getNCBIUrl(id, database)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                                >
                                  View
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          )
                        })
                      })()}
                      {(results.idlist || results.idList).length > 50 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          Showing first 50 of {(results.idlist || results.idList).length} results
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No results found
                  </p>
                )}
              </div>
            )}

            {queryType === 'esummary' && (
              <div className="space-y-3">
                {results.uids && results.uids.length > 0 ? (
                  results.uids.map((uid: string) => {
                    const summary = results[uid]
                    // Handle different author formats
                    const getAuthors = () => {
                      if (!summary.authors) return null
                      if (Array.isArray(summary.authors)) {
                        return summary.authors.map((a: any) => a.name || a).join(', ')
                      }
                      return String(summary.authors)
                    }
                    
                    return (
                      <div key={uid} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-medium">ID: {uid}</span>
                          <a
                            href={getNCBIUrl(uid, database)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on NCBI
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {summary && (
                          <div className="space-y-1 text-xs">
                            {(summary.title || summary.title2) && (
                              <p className="font-medium">{summary.title || summary.title2}</p>
                            )}
                            {getAuthors() && (
                              <p className="text-muted-foreground">
                                Authors: {getAuthors()}
                              </p>
                            )}
                            {(summary.pubdate || summary.pd) && (
                              <p className="text-muted-foreground">
                                Published: {summary.pubdate || summary.pd}
                              </p>
                            )}
                            {(summary.source || summary.fulljournalname) && (
                              <p className="text-muted-foreground">
                                Source: {summary.source || summary.fulljournalname}
                              </p>
                            )}
                            {summary.abstract && (
                              <p className="text-muted-foreground line-clamp-3 mt-2">
                                {summary.abstract}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No summaries available
                  </p>
                )}
              </div>
            )}

            {queryType === 'efetch' && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium mb-2">
                    Full Record Data ({results.format || 'raw'}):
                  </p>
                  <pre className="text-xs overflow-x-auto bg-white p-2 rounded border max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {typeof results.data === 'string' 
                      ? results.data 
                      : JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-xs text-muted-foreground border-t">
          <p className="italic">
            Data provided by NCBI. Rate limit: 10 requests/second with API key. Please review NCBI's{' '}
            <a
              href="https://www.ncbi.nlm.nih.gov/About/disclaimer.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              disclaimer and copyright notice
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

