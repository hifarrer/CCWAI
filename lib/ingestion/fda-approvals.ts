import { prisma } from '@/lib/db/client'
import { CancerType } from '@/lib/types'

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json'

// Map cancer types to search terms for OpenFDA API
const CANCER_TYPE_SEARCH_TERMS: Record<string, string[]> = {
  'breast': ['breast cancer', 'breast', 'mammary'],
  'lung': ['lung cancer', 'lung', 'pulmonary', 'non-small cell lung', 'nsclc', 'small cell lung', 'sclc'],
  'colorectal': ['colorectal cancer', 'colorectal', 'colon cancer', 'colon', 'rectal cancer', 'rectal'],
  'prostate': ['prostate cancer', 'prostate'],
  'pancreatic': ['pancreatic cancer', 'pancreatic', 'pancreas'],
  'liver': ['liver cancer', 'liver', 'hepatocellular', 'hcc'],
  'stomach': ['stomach cancer', 'stomach', 'gastric cancer', 'gastric'],
  'esophageal': ['esophageal cancer', 'esophageal', 'esophagus'],
  'bladder': ['bladder cancer', 'bladder'],
  'kidney': ['kidney cancer', 'kidney', 'renal cell', 'renal'],
  'cervical': ['cervical cancer', 'cervical'],
  'ovarian': ['ovarian cancer', 'ovarian'],
  'leukemia': ['leukemia', 'leukemic', 'aml', 'all', 'cll', 'cml'],
  'lymphoma': ['lymphoma', 'hodgkin', 'non-hodgkin', 'nhl'],
  'melanoma': ['melanoma', 'melanocytic'],
  'brain': ['brain cancer', 'brain', 'glioma', 'glioblastoma', 'gbm', 'astrocytoma'],
  'other': ['cancer', 'tumor', 'tumour', 'oncology', 'carcinoma'],
}

interface OpenFDALabel {
  application_number?: string[]
  brand_name?: string[]
  generic_name?: string[]
  openfda?: {
    manufacturer_name?: string[]
    application_number?: string[]
  }
  effective_time?: string
  indications_and_usage?: string[]
  purpose?: string[]
  [key: string]: any
}

interface OpenFDAResponse {
  results?: OpenFDALabel[]
  meta?: {
    results?: {
      total?: number
      limit?: number
      skip?: number
    }
  }
  error?: {
    message: string
    code: string
  }
}

/**
 * Fetches FDA drug approvals from OpenFDA API for a specific cancer type
 * Tries multiple search strategies to find relevant approvals
 */
async function fetchFdaApprovalsForCancerType(
  cancerType: CancerType,
  limit: number = 20
): Promise<OpenFDALabel[]> {
  const searchTerms = CANCER_TYPE_SEARCH_TERMS[cancerType] || [cancerType]
  
  // Try multiple search strategies
  const searchStrategies = [
    // Strategy 1: Simple search in indications_and_usage with quotes
    `indications_and_usage:"${searchTerms[0]}"`,
    // Strategy 2: Search without quotes (partial match)
    `indications_and_usage:${searchTerms[0]}`,
    // Strategy 3: Search in purpose field
    `purpose:"${searchTerms[0]}"`,
    // Strategy 4: Search in generic_name (for cancer drugs)
    `generic_name:"${searchTerms[0]}"`,
  ]

  // Filter for recent approvals (last 5 years)
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

  for (const searchQuery of searchStrategies) {
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        limit: '100', // Get more results to filter
        skip: '0',
      })

      const url = `${OPENFDA_BASE_URL}?${params.toString()}`
      console.log(`Querying OpenFDA for ${cancerType}: ${searchQuery}`)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        // Try next strategy if this one fails
        if (response.status === 500) {
          console.warn(`OpenFDA returned 500 for query: ${searchQuery}, trying next strategy...`)
          continue
        }
        const errorText = await response.text()
        console.error(`OpenFDA API error for ${cancerType}: ${response.status} ${response.statusText}`)
        console.error(`Error details: ${errorText.substring(0, 500)}`)
        continue
      }

      const data: OpenFDAResponse = await response.json()

      if (data.error) {
        console.warn(`OpenFDA API error for ${cancerType}: ${data.error.message}, trying next strategy...`)
        continue
      }

      const results = data.results || []
      
      if (results.length === 0) {
        // No results, try next strategy
        continue
      }

      // Filter for recent approvals and cancer-related content
      const filteredResults = results.filter(label => {
        // Check if label has effective_time (approval date)
        if (!label.effective_time) return false
        
        // Parse date
        const dateStr = label.effective_time
        if (dateStr.length >= 8) {
          const year = parseInt(dateStr.substring(0, 4))
          const month = parseInt(dateStr.substring(4, 6)) - 1
          const day = parseInt(dateStr.substring(6, 8))
          const labelDate = new Date(year, month, day)
          
          // Must be within last 5 years
          if (labelDate < fiveYearsAgo) return false
        } else {
          return false
        }

        // Check if it's actually cancer-related by looking at indication text
        const indicationText = [
          ...(label.indications_and_usage || []),
          ...(label.purpose || []),
        ].join(' ').toLowerCase()

        // Must contain cancer-related keywords
        const hasCancerKeyword = searchTerms.some(term => 
          indicationText.includes(term.toLowerCase())
        )

        return hasCancerKeyword
      })

      if (filteredResults.length > 0) {
        console.log(`Found ${filteredResults.length} FDA approvals for ${cancerType} using query: ${searchQuery}`)
        return filteredResults.slice(0, limit)
      }
    } catch (error) {
      console.warn(`Error with search strategy "${searchQuery}":`, error)
      // Continue to next strategy
      continue
    }
  }

  console.log(`No FDA approvals found for ${cancerType} after trying all search strategies`)
  return []
}

/**
 * Extracts cancer types from FDA label data
 */
function extractCancerTypesFromLabel(label: OpenFDALabel): string[] {
  const cancerTypes: string[] = []
  const textContent = [
    ...(label.indications_and_usage || []),
    ...(label.purpose || []),
    ...(label.brand_name || []),
    ...(label.generic_name || []),
  ].join(' ').toLowerCase()

  // Check each cancer type
  Object.entries(CANCER_TYPE_SEARCH_TERMS).forEach(([cancerType, terms]) => {
    if (terms.some(term => textContent.includes(term.toLowerCase()))) {
      cancerTypes.push(cancerType)
    }
  })

  return [...new Set(cancerTypes)]
}

/**
 * Parses OpenFDA label data into our database format
 */
function parseFdaApproval(label: OpenFDALabel, cancerType: CancerType): {
  applicationNumber: string | null
  drugName: string
  genericName: string | null
  company: string | null
  approvalDate: Date | null
  cancerTypes: string[]
  indication: string | null
  url: string | null
  metadata: any
} {
  const applicationNumber = label.application_number?.[0] || 
                           label.openfda?.application_number?.[0] || 
                           null
  
  const drugName = label.brand_name?.[0] || 
                   label.generic_name?.[0] || 
                   'Unknown Drug'
  
  const genericName = label.generic_name?.[0] || null
  
  const company = label.openfda?.manufacturer_name?.[0] || null
  
  // Parse effective_time (approval date) - format is typically YYYYMMDD
  let approvalDate: Date | null = null
  if (label.effective_time) {
    const dateStr = label.effective_time
    if (dateStr.length >= 8) {
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1 // Month is 0-indexed
      const day = parseInt(dateStr.substring(6, 8))
      approvalDate = new Date(year, month, day)
    }
  }
  
  const indication = label.indications_and_usage?.[0] || 
                     label.purpose?.[0] || 
                     null
  
  // Build FDA URL if we have application number
  const url = applicationNumber 
    ? `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${applicationNumber}`
    : null
  
  // Extract cancer types from the label
  const extractedCancerTypes = extractCancerTypesFromLabel(label)
  const cancerTypes = extractedCancerTypes.length > 0 
    ? extractedCancerTypes 
    : [cancerType] // Fall back to the searched cancer type
  
  return {
    applicationNumber,
    drugName,
    genericName,
    company,
    approvalDate,
    cancerTypes,
    indication,
    url,
    metadata: label,
  }
}

/**
 * Main ingestion function - fetches and saves FDA approvals for all cancer types
 */
export async function ingestFdaApprovals() {
  const errors: Error[] = []
  let totalIngested = 0
  const cancerTypes: CancerType[] = [
    'breast', 'lung', 'colorectal', 'prostate', 'pancreatic',
    'liver', 'stomach', 'esophageal', 'bladder', 'kidney',
    'cervical', 'ovarian', 'leukemia', 'lymphoma', 'melanoma',
    'brain', 'other',
  ]

  console.log(`Starting FDA approvals ingestion for ${cancerTypes.length} cancer types...`)

  for (const cancerType of cancerTypes) {
    try {
      console.log(`Fetching FDA approvals for ${cancerType}...`)
      
      // Fetch approvals from OpenFDA (limit to 20 per cancer type)
      const labels = await fetchFdaApprovalsForCancerType(cancerType, 20)
      
      if (labels.length === 0) {
        console.log(`No FDA approvals found for ${cancerType}`)
        continue
      }

      console.log(`Found ${labels.length} FDA approvals for ${cancerType}`)

      let ingested = 0
      for (const label of labels) {
        try {
          const approvalData = parseFdaApproval(label, cancerType)
          
          // Skip if no application number (we need a unique identifier)
          if (!approvalData.applicationNumber) {
            console.warn(`Skipping approval without application number: ${approvalData.drugName}`)
            continue
          }

          // Check if approval already exists by application number
          const existing = await prisma.fdaApproval.findUnique({
            where: { applicationNumber: approvalData.applicationNumber },
          })

          if (existing) {
            // Update existing record if needed
            await prisma.fdaApproval.update({
              where: { applicationNumber: approvalData.applicationNumber },
              data: {
                drugName: approvalData.drugName,
                genericName: approvalData.genericName,
                company: approvalData.company,
                approvalDate: approvalData.approvalDate,
                cancerTypes: approvalData.cancerTypes,
                indication: approvalData.indication,
                url: approvalData.url,
                metadata: approvalData.metadata,
              },
            })
          } else {
            // Create new record
            await prisma.fdaApproval.create({
              data: approvalData,
            })
            ingested++
          }

          // Log the ingestion
          await prisma.dataIngestionLog.create({
            data: {
              source: 'openfda',
              recordId: approvalData.applicationNumber || approvalData.drugName,
              recordType: 'fda_approval',
              action: existing ? 'updated' : 'created',
              metadata: {
                cancerType,
                drugName: approvalData.drugName,
              },
            },
          })
        } catch (itemError) {
          console.error(`Error processing FDA approval for ${cancerType}:`, itemError)
          errors.push(itemError as Error)
        }
      }

      totalIngested += ingested
      console.log(`Ingested ${ingested} new FDA approvals for ${cancerType}`)
      
      // Add a small delay to respect rate limits (OpenFDA allows 240 requests/minute)
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay = ~120 requests/minute
    } catch (cancerTypeError) {
      console.error(`Error processing cancer type ${cancerType}:`, cancerTypeError)
      errors.push(cancerTypeError as Error)
    }
  }

  console.log(`FDA approvals ingestion complete. Total ingested: ${totalIngested}, Errors: ${errors.length}`)

  return {
    ingested: totalIngested,
    errors,
  }
}

