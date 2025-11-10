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
    spl_set_id?: string[]
    spl_id?: string[]
  }
  effective_time?: string
  indications_and_usage?: string[]
  purpose?: string[]
  spl_patient_package_insert?: string[]
  spl_set_id?: string[]
  spl_id?: string[]
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
  limit: number = 100
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
  labelPdfUrl: string | null
  metadata: any
} {
  // Extract application number from various possible locations
  const applicationNumber = label.application_number?.[0] || 
                           label.openfda?.application_number?.[0] ||
                           (label as any).openfda?.application_number?.[0] ||
                           null
  
  // Extract drug name - try multiple field names and formats
  let drugName = 'Unknown Drug'
  
  // Try brand_name (array)
  if (label.brand_name && Array.isArray(label.brand_name) && label.brand_name.length > 0) {
    drugName = label.brand_name[0]
  }
  // Try brand_name (string)
  else if ((label as any).brand_name && typeof (label as any).brand_name === 'string') {
    drugName = (label as any).brand_name
  }
  // Try openfda.brand_name
  else if ((label as any).openfda?.brand_name && Array.isArray((label as any).openfda.brand_name) && (label as any).openfda.brand_name.length > 0) {
    drugName = (label as any).openfda.brand_name[0]
  }
  // Try generic_name as fallback
  else if (label.generic_name && Array.isArray(label.generic_name) && label.generic_name.length > 0) {
    drugName = label.generic_name[0]
  }
  // Try generic_name as string
  else if ((label as any).generic_name && typeof (label as any).generic_name === 'string') {
    drugName = (label as any).generic_name
  }
  // Try openfda.generic_name
  else if ((label as any).openfda?.generic_name && Array.isArray((label as any).openfda.generic_name) && (label as any).openfda.generic_name.length > 0) {
    drugName = (label as any).openfda.generic_name[0]
  }
  // Try product_ndc or spl_product_data_elements
  else if ((label as any).product_ndc && Array.isArray((label as any).product_ndc) && (label as any).product_ndc.length > 0) {
    drugName = (label as any).product_ndc[0]
  }
  // Last resort: try to extract from spl_product_data_elements
  else if ((label as any).spl_product_data_elements) {
    const splData = (label as any).spl_product_data_elements
    if (Array.isArray(splData) && splData.length > 0 && splData[0].name) {
      drugName = splData[0].name
    }
  }
  
  // Extract generic name
  let genericName: string | null = null
  if (label.generic_name && Array.isArray(label.generic_name) && label.generic_name.length > 0) {
    genericName = label.generic_name[0]
  } else if ((label as any).generic_name && typeof (label as any).generic_name === 'string') {
    genericName = (label as any).generic_name
  } else if ((label as any).openfda?.generic_name && Array.isArray((label as any).openfda.generic_name) && (label as any).openfda.generic_name.length > 0) {
    genericName = (label as any).openfda.generic_name[0]
  }
  
  // Extract company/manufacturer
  let company: string | null = null
  if (label.openfda?.manufacturer_name && Array.isArray(label.openfda.manufacturer_name) && label.openfda.manufacturer_name.length > 0) {
    company = label.openfda.manufacturer_name[0]
  } else if ((label as any).openfda?.manufacturer_name && Array.isArray((label as any).openfda.manufacturer_name) && (label as any).openfda.manufacturer_name.length > 0) {
    company = (label as any).openfda.manufacturer_name[0]
  } else if ((label as any).manufacturer_name && Array.isArray((label as any).manufacturer_name) && (label as any).manufacturer_name.length > 0) {
    company = (label as any).manufacturer_name[0]
  }
  
  // Log if we still have Unknown Drug to help debug
  if (drugName === 'Unknown Drug') {
    console.warn('Could not extract drug name from label:', {
      hasBrandName: !!label.brand_name,
      hasGenericName: !!label.generic_name,
      hasOpenFDA: !!label.openfda,
      labelKeys: Object.keys(label).slice(0, 10), // First 10 keys for debugging
    })
  }
  
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
  // Remove prefixes like BLA, NDA, ANDA, etc. from application number for the URL
  let url: string | null = null
  if (applicationNumber) {
    // Remove common FDA application type prefixes (BLA, NDA, ANDA, etc.)
    const cleanAppNumber = applicationNumber.replace(/^(BLA|NDA|ANDA|BL|ND)\s*/i, '')
    url = `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${cleanAppNumber}`
  }
  
  // Extract PDF label URL if available
  let labelPdfUrl: string | null = null
  
  // Try spl_patient_package_insert field (direct PDF URL)
  if (label.spl_patient_package_insert && Array.isArray(label.spl_patient_package_insert) && label.spl_patient_package_insert.length > 0) {
    labelPdfUrl = label.spl_patient_package_insert[0]
  }
  // Try spl_set_id to construct PDF URL
  else if (label.spl_set_id && Array.isArray(label.spl_set_id) && label.spl_set_id.length > 0) {
    const splSetId = label.spl_set_id[0]
    // FDA SPL PDF URL format: https://www.accessdata.fda.gov/spl/data/{spl_set_id}/{spl_set_id}.pdf
    labelPdfUrl = `https://www.accessdata.fda.gov/spl/data/${splSetId}/${splSetId}.pdf`
  }
  // Try openfda.spl_set_id
  else if (label.openfda?.spl_set_id && Array.isArray(label.openfda.spl_set_id) && label.openfda.spl_set_id.length > 0) {
    const splSetId = label.openfda.spl_set_id[0]
    labelPdfUrl = `https://www.accessdata.fda.gov/spl/data/${splSetId}/${splSetId}.pdf`
  }
  // Try spl_id to construct PDF URL
  else if (label.spl_id && Array.isArray(label.spl_id) && label.spl_id.length > 0) {
    const splId = label.spl_id[0]
    labelPdfUrl = `https://www.accessdata.fda.gov/spl/data/${splId}/${splId}.pdf`
  }
  // Try openfda.spl_id
  else if (label.openfda?.spl_id && Array.isArray(label.openfda.spl_id) && label.openfda.spl_id.length > 0) {
    const splId = label.openfda.spl_id[0]
    labelPdfUrl = `https://www.accessdata.fda.gov/spl/data/${splId}/${splId}.pdf`
  }
  
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
    labelPdfUrl,
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
      
      // Fetch approvals from OpenFDA (limit to 100 per cancer type)
      const labels = await fetchFdaApprovalsForCancerType(cancerType, 100)
      
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
            // Update existing record - especially if drugName was Unknown Drug
            const needsUpdate = existing.drugName === 'Unknown Drug' || 
                               existing.drugName !== approvalData.drugName ||
                               !existing.genericName && approvalData.genericName
            
            if (needsUpdate) {
              await prisma.fdaApproval.update({
                where: { applicationNumber: approvalData.applicationNumber },
                data: {
                  drugName: approvalData.drugName,
                  genericName: approvalData.genericName || existing.genericName,
                  company: approvalData.company || existing.company,
                  approvalDate: approvalData.approvalDate || existing.approvalDate,
                  cancerTypes: approvalData.cancerTypes,
                  indication: approvalData.indication || existing.indication,
                  url: approvalData.url || existing.url,
                  labelPdfUrl: approvalData.labelPdfUrl || existing.labelPdfUrl,
                  metadata: approvalData.metadata,
                },
              })
              console.log(`Updated FDA approval: ${approvalData.applicationNumber} - ${approvalData.drugName}`)
            }
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

