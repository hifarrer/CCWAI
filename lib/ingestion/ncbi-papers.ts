import { prisma } from '@/lib/db/client'
import { generateLaypersonSummary, generateClinicalSummary } from '@/lib/ai/summarization'

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const MAX_RESULTS_PER_QUERY = 1000

// Rate limiting: 10 requests/second with API key, 3 without
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface PubMedPaper {
  pubmedId: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  publicationDate: Date | null
  keywords: string[]
  fullTextUrl?: string
}

async function queryNCBI(
  utility: string,
  params: Record<string, string>,
  apiKey?: string,
  expectJson: boolean = true
): Promise<any> {
  const url = new URL(`${NCBI_BASE_URL}/${utility}.fcgi`)
  
  // Add standard parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value)
    }
  })

  // Add API key if provided
  if (apiKey) {
    url.searchParams.append('api_key', apiKey)
  }

  // Add tool and email parameters as recommended by NCBI
  url.searchParams.append('tool', 'CCWAI')
  url.searchParams.append('email', 'support@ccwai.com')

  // Add retmode for JSON responses (unless explicitly overridden)
  if (expectJson && !url.searchParams.has('retmode')) {
    url.searchParams.append('retmode', 'json')
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': expectJson ? 'application/json' : '*/*',
      },
    })

    // Check for rate limiting errors
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'API rate limit exceeded. Please try again later.')
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NCBI API error: ${response.status} - ${errorText}`)
    }

    // Handle JSON responses
    if (expectJson) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        
        // Check for NCBI error messages in response
        if (data.error) {
          throw new Error(data.error)
        }

        return data
      }
    }

    // Handle text/XML responses
    const text = await response.text()
    
    // Try to parse as JSON in case it's actually JSON (error response)
    try {
      const jsonData = JSON.parse(text)
      if (jsonData.error) {
        throw new Error(jsonData.error)
      }
      return jsonData
    } catch {
      // Not JSON, return as text
      return text
    }
  } catch (error: any) {
    console.error('NCBI query error:', error)
    throw error
  }
}

/**
 * Search PubMed and return paper IDs
 */
async function searchPubMed(query: string, apiKey?: string, maxResults: number = 1000): Promise<string[]> {
  const params: Record<string, string> = {
    db: 'pubmed',
    term: query,
    retmax: Math.min(maxResults, 10000).toString(), // NCBI allows up to 10,000
    retstart: '0',
  }
  
  await delay(100) // Rate limiting
  
  const response = await queryNCBI('esearch', params, apiKey)
  const result = response.esearchresult || response
  
  const idList = result.idlist || []
  return idList.slice(0, maxResults) // Ensure we don't exceed maxResults
}

/**
 * Fetch paper details from PubMed using esummary
 */
async function fetchPaperDetails(ids: string[], apiKey?: string): Promise<any[]> {
  if (ids.length === 0) return []
  
  // NCBI esummary can handle up to 200 IDs at a time
  const batchSize = 200
  const papers: any[] = []
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    
    await delay(100) // Rate limiting
    
    const params: Record<string, string> = {
      db: 'pubmed',
      id: batch.join(','),
    }
    
    const response = await queryNCBI('esummary', params, apiKey)
    const result = response.result || response
    
    // Extract papers from result
    const uids = result.uids || []
    for (const uid of uids) {
      const paperData = result[uid]
      if (paperData) {
        papers.push({
          pubmedId: uid,
          ...paperData,
        })
      }
    }
  }
  
  return papers
}

/**
 * Parse PubMed paper data from esummary response
 */
function parsePaperFromSummary(paperData: any): PubMedPaper | null {
  try {
    const pubmedId = paperData.uid || paperData.pubmedId || ''
    if (!pubmedId) return null

    // Extract title - can be string or array
    const title = Array.isArray(paperData.title) 
      ? paperData.title[0] || '' 
      : (paperData.title || '')
    
    // Extract abstract - can be string or array, and may be in different fields
    let abstract = ''
    if (paperData.abstracttext) {
      abstract = Array.isArray(paperData.abstracttext)
        ? paperData.abstracttext.join(' ')
        : (paperData.abstracttext || '')
    } else if (paperData.abstract) {
      abstract = Array.isArray(paperData.abstract)
        ? paperData.abstract.join(' ')
        : (paperData.abstract || '')
    }
    
    // Skip papers without abstracts
    if (!abstract || abstract.trim() === '' || abstract.toLowerCase().includes('no abstract available')) {
      return null
    }

    // Extract authors - can be array of objects or array of strings
    const authors: string[] = []
    if (paperData.authors && Array.isArray(paperData.authors)) {
      for (const author of paperData.authors) {
        if (typeof author === 'string') {
          authors.push(author)
        } else if (author && author.name) {
          authors.push(author.name)
        } else if (author && typeof author === 'object') {
          // Try to construct name from firstname, lastname, etc.
          const nameParts = [author.lastname, author.firstname, author.initials]
            .filter(Boolean)
            .join(' ')
          if (nameParts) {
            authors.push(nameParts)
          }
        }
      }
    }

    // Extract publication date
    let publicationDate: Date | null = null
    if (paperData.pubdate) {
      // Try to parse date (format can vary: "2024 Jan", "2024-01-15", etc.)
      const dateStr = String(paperData.pubdate).trim()
      // Try various date formats
      const dateMatch = dateStr.match(/(\d{4})[-\s](\d{1,2})[-\s](\d{1,2})/) || 
                        dateStr.match(/(\d{4})[-\s](\d{1,2})/) || 
                        dateStr.match(/(\d{4})/)
      if (dateMatch) {
        const year = parseInt(dateMatch[1])
        const month = dateMatch[2] ? parseInt(dateMatch[2]) - 1 : 0
        const day = dateMatch[3] ? parseInt(dateMatch[3]) : 1
        publicationDate = new Date(year, month, day)
        // Validate date
        if (isNaN(publicationDate.getTime())) {
          publicationDate = null
        }
      }
    }

    // Extract keywords - can be array or single value
    const keywords: string[] = []
    if (paperData.keywords) {
      if (Array.isArray(paperData.keywords)) {
        keywords.push(...paperData.keywords.filter((k: any) => k && typeof k === 'string'))
      } else if (typeof paperData.keywords === 'string') {
        keywords.push(paperData.keywords)
      }
    }

    // Extract journal - can be string or array
    const journal = Array.isArray(paperData.source)
      ? paperData.source[0] || ''
      : (paperData.source || paperData.fulljournalname || '')

    // Full text URL
    const fullTextUrl = `https://www.ncbi.nlm.nih.gov/pubmed/${pubmedId}`

    return {
      pubmedId: String(pubmedId),
      title: title.trim(),
      abstract: abstract.trim(),
      authors,
      journal: journal.trim(),
      publicationDate,
      keywords,
      fullTextUrl,
    }
  } catch (error) {
    console.error('Error parsing paper data:', error, paperData)
    return null
  }
}

/**
 * Extract cancer types from text content
 */
function extractCancerTypes(
  keywords: string[],
  title: string,
  abstract: string,
  queryName?: string | null
): string[] {
  const text = `${title} ${abstract}`.toLowerCase()
  const keywordsLower = keywords.map(k => k.toLowerCase())
  const queryNameLower = queryName ? queryName.toLowerCase() : ''
  const allText = `${text} ${keywordsLower.join(' ')} ${queryNameLower}`

  const cancerTypes: string[] = []
  const cancerKeywords: Record<string, string> = {
    'breast cancer': 'breast',
    'breast': 'breast',
    'lung cancer': 'lung',
    'lung': 'lung',
    'colorectal cancer': 'colorectal',
    'colorectal': 'colorectal',
    'prostate cancer': 'prostate',
    'prostate': 'prostate',
    'pancreatic cancer': 'pancreatic',
    'pancreatic': 'pancreatic',
    'liver cancer': 'liver',
    'hepatocellular': 'liver',
    'stomach cancer': 'stomach',
    'gastric': 'stomach',
    'esophageal cancer': 'esophageal',
    'esophageal': 'esophageal',
    'bladder cancer': 'bladder',
    'bladder': 'bladder',
    'kidney cancer': 'kidney',
    'renal': 'kidney',
    'cervical cancer': 'cervical',
    'cervical': 'cervical',
    'ovarian cancer': 'ovarian',
    'ovarian': 'ovarian',
    'leukemia': 'leukemia',
    'lymphoma': 'lymphoma',
    'melanoma': 'melanoma',
    'brain cancer': 'brain',
    'glioma': 'brain',
    'glioblastoma': 'brain',
  }

  Object.entries(cancerKeywords).forEach(([keyword, type]) => {
    if (allText.includes(keyword.toLowerCase())) {
      cancerTypes.push(type)
    }
  })

  return [...new Set(cancerTypes)]
}

/**
 * Extract treatment types from text content
 */
function extractTreatmentTypes(
  keywords: string[],
  title: string,
  abstract: string
): string[] {
  const text = `${title} ${abstract}`.toLowerCase()
  const keywordsLower = keywords.map(k => k.toLowerCase())
  const allText = `${text} ${keywordsLower.join(' ')}`

  const treatmentTypes: string[] = []
  const treatmentKeywords: Record<string, string> = {
    'immunotherapy': 'immunotherapy',
    'chemo': 'chemotherapy',
    'chemotherapy': 'chemotherapy',
    'radiation': 'radiation',
    'radiotherapy': 'radiation',
    'targeted therapy': 'targeted-therapy',
    'targeted treatment': 'targeted-therapy',
    'hormone therapy': 'hormone-therapy',
    'hormonal therapy': 'hormone-therapy',
    'stem cell': 'stem-cell-transplant',
    'surgery': 'surgery',
    'surgical': 'surgery',
  }

  Object.entries(treatmentKeywords).forEach(([keyword, type]) => {
    if (allText.includes(keyword.toLowerCase())) {
      treatmentTypes.push(type)
    }
  })

  return [...new Set(treatmentTypes)]
}

/**
 * Main ingestion function for NCBI/PubMed papers
 */
export async function ingestPapersFromNCBI() {
  const errors: Error[] = []
  let totalIngested = 0
  const apiKey = process.env.NCBI_API_KEY

  // Fetch active NCBI queries from database
  const ncbiQueries = await prisma.ncbiQuery.findMany({
    where: {
      isActive: true,
    },
  })

  if (ncbiQueries.length === 0) {
    console.warn('No active NCBI queries found in database')
    return { ingested: 0, errors: [] }
  }

  console.log(`Found ${ncbiQueries.length} active NCBI queries`)

  for (const ncbiQuery of ncbiQueries) {
    try {
      console.log(`Processing query: ${ncbiQuery.name || ncbiQuery.query}`)
      
      // Search PubMed for paper IDs
      const paperIds = await searchPubMed(ncbiQuery.query, apiKey, MAX_RESULTS_PER_QUERY)
      
      if (paperIds.length === 0) {
        console.log(`No papers found for query: ${ncbiQuery.name || ncbiQuery.query}`)
        continue
      }

      console.log(`Found ${paperIds.length} papers for query: ${ncbiQuery.name || ncbiQuery.query}`)

      // Fetch paper details in batches
      const papers = await fetchPaperDetails(paperIds, apiKey)
      
      let queryIngested = 0
      
      for (const paperData of papers) {
        try {
          const parsedPaper = parsePaperFromSummary(paperData)
          
          if (!parsedPaper) {
            // Log skipped papers
            await prisma.dataIngestionLog.create({
              data: {
                source: 'pubmed',
                recordId: paperData.pubmedId || paperData.uid || 'unknown',
                recordType: 'research_paper',
                action: 'skipped',
                metadata: { 
                  reason: 'no_abstract_or_invalid',
                  queryId: ncbiQuery.id,
                  queryName: ncbiQuery.name,
                },
              },
            })
            continue
          }

          // Check if paper already exists
          const existing = await prisma.researchPaper.findUnique({
            where: { pubmedId: parsedPaper.pubmedId },
          })

          if (existing) {
            // Log as skipped
            await prisma.dataIngestionLog.create({
              data: {
                source: 'pubmed',
                recordId: parsedPaper.pubmedId,
                recordType: 'research_paper',
                action: 'skipped',
                metadata: { 
                  reason: 'already_exists',
                  queryId: ncbiQuery.id,
                  queryName: ncbiQuery.name,
                },
              },
            })
            continue
          }

          // Extract cancer types and treatment types
          const cancerTypes = extractCancerTypes(
            parsedPaper.keywords,
            parsedPaper.title,
            parsedPaper.abstract,
            ncbiQuery.name
          )
          const treatmentTypes = extractTreatmentTypes(
            parsedPaper.keywords,
            parsedPaper.title,
            parsedPaper.abstract
          )

          // Generate summaries
          const summaryPlain = parsedPaper.abstract
            ? await generateLaypersonSummary(parsedPaper.abstract)
            : null
          const summaryClinical = parsedPaper.abstract
            ? await generateClinicalSummary(parsedPaper.abstract)
            : null

          // Create paper
          const paper = await prisma.researchPaper.create({
            data: {
              pubmedId: parsedPaper.pubmedId,
              title: parsedPaper.title,
              abstract: parsedPaper.abstract,
              authors: parsedPaper.authors,
              journal: parsedPaper.journal || null,
              publicationDate: parsedPaper.publicationDate,
              cancerTypes,
              treatmentTypes,
              keywords: parsedPaper.keywords,
              fullTextUrl: parsedPaper.fullTextUrl || null,
              summaryPlain,
              summaryClinical,
            },
          })

          // Log ingestion
          await prisma.dataIngestionLog.create({
            data: {
              source: 'pubmed',
              recordId: parsedPaper.pubmedId,
              recordType: 'research_paper',
              action: 'created',
              metadata: { 
                paperId: paper.id,
                queryId: ncbiQuery.id,
                queryName: ncbiQuery.name,
              },
            },
          })

          queryIngested++
          totalIngested++
        } catch (paperError) {
          console.error('Error ingesting paper:', paperError)
          errors.push(paperError as Error)
        }
      }

      console.log(`Ingested ${queryIngested} new papers from query: ${ncbiQuery.name || ncbiQuery.query}`)
    } catch (queryError) {
      console.error(`Error processing query ${ncbiQuery.name || ncbiQuery.query}:`, queryError)
      errors.push(queryError as Error)
    }
  }

  return { ingested: totalIngested, errors }
}

