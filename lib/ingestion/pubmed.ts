import { prisma } from '@/lib/db/client'
import { generateLaypersonSummary, generateClinicalSummary } from '@/lib/ai/summarization'
// import { generateEmbedding } from '@/lib/ai/openai' // Will be used in Phase 2

interface PubMedEntry {
  pubmed_id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  publication_date: string
  keywords: string[]
  full_text_url?: string
}

export async function ingestPubMedPapers(apifyData?: any[]) {
  // In production, this would fetch from Apify or PubMed API
  // For now, this is a placeholder structure
  
  if (!apifyData || apifyData.length === 0) {
    console.log('No PubMed data provided')
    return { ingested: 0, errors: [] }
  }

  const errors: Error[] = []
  let ingested = 0

  for (const entry of apifyData) {
    try {
      const pubmedId = entry.pubmed_id || entry.id
      
      // Skip papers without abstracts or with "No abstract available" text
      const abstract = entry.abstract?.trim() || ''
      if (!abstract || abstract === '' || abstract.toLowerCase().includes('no abstract available')) {
        await prisma.dataIngestionLog.create({
          data: {
            source: 'pubmed',
            recordId: pubmedId,
            recordType: 'research_paper',
            action: 'skipped',
            metadata: { reason: 'no_abstract' },
          },
        })
        continue
      }
      
      // Check if paper already exists
      const existing = await prisma.researchPaper.findUnique({
        where: { pubmedId },
      })

      if (existing) {
        // Log as updated if data has changed
        await prisma.dataIngestionLog.create({
          data: {
            source: 'pubmed',
            recordId: pubmedId,
            recordType: 'research_paper',
            action: 'skipped',
            metadata: { reason: 'already_exists' },
          },
        })
        continue
      }

      // Extract cancer types and treatment types from keywords
      const cancerTypes = extractCancerTypes(entry.keywords || [], entry.title, abstract)
      const treatmentTypes = extractTreatmentTypes(entry.keywords || [], entry.title, abstract)

      // Generate summaries
      const summaryPlain = abstract 
        ? await generateLaypersonSummary(abstract)
        : null
      const summaryClinical = abstract
        ? await generateClinicalSummary(abstract)
        : null

      // Create paper
      const paper = await prisma.researchPaper.create({
        data: {
          pubmedId,
          title: entry.title,
          abstract: abstract,
          authors: entry.authors || [],
          journal: entry.journal || null,
          publicationDate: entry.publication_date ? new Date(entry.publication_date) : null,
          cancerTypes,
          treatmentTypes,
          keywords: entry.keywords || [],
          fullTextUrl: entry.full_text_url || null,
          summaryPlain,
          summaryClinical,
        },
      })

      // Note: Embeddings will be added in Phase 2 when pgvector extension is enabled
      // For now, we skip embedding generation to avoid requiring pgvector

      // Log ingestion
      await prisma.dataIngestionLog.create({
        data: {
          source: 'pubmed',
          recordId: pubmedId,
          recordType: 'research_paper',
          action: 'created',
          metadata: { paperId: paper.id },
        },
      })

      ingested++
    } catch (error) {
      console.error('Error ingesting paper:', error)
      errors.push(error as Error)
    }
  }

  return { ingested, errors }
}

function extractCancerTypes(
  keywords: string[],
  title: string,
  abstract: string
): string[] {
  const text = `${title} ${abstract}`.toLowerCase()
  const keywordsLower = keywords.map(k => k.toLowerCase())
  const allText = `${text} ${keywordsLower.join(' ')}`

  const cancerTypes: string[] = []
  const cancerKeywords: Record<string, string> = {
    'breast cancer': 'breast',
    'lung cancer': 'lung',
    'colorectal cancer': 'colorectal',
    'prostate cancer': 'prostate',
    'pancreatic cancer': 'pancreatic',
    'liver cancer': 'liver',
    'stomach cancer': 'stomach',
    'esophageal cancer': 'esophageal',
    'bladder cancer': 'bladder',
    'kidney cancer': 'kidney',
    'cervical cancer': 'cervical',
    'ovarian cancer': 'ovarian',
    'leukemia': 'leukemia',
    'lymphoma': 'lymphoma',
    'melanoma': 'melanoma',
    'brain cancer': 'brain',
  }

  Object.entries(cancerKeywords).forEach(([keyword, type]) => {
    if (allText.includes(keyword.toLowerCase())) {
      cancerTypes.push(type)
    }
  })

  return [...new Set(cancerTypes)]
}

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

