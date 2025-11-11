import { TrialMatchCriteria } from '@/lib/types'
import { parseString } from 'xml2js'

// Map cancer types to search terms for ICTRP
const cancerTypeMap: Record<string, string> = {
  breast: 'breast cancer',
  lung: 'lung cancer',
  colorectal: 'colorectal cancer',
  prostate: 'prostate cancer',
  pancreatic: 'pancreatic cancer',
  liver: 'liver cancer',
  stomach: 'stomach cancer',
  esophageal: 'esophagus cancer',
  bladder: 'bladder cancer',
  kidney: 'kidney cancer',
  cervical: 'cervical cancer',
  ovarian: 'ovarian cancer',
  leukemia: 'leukemia',
  lymphoma: 'lymphoma',
  melanoma: 'melanoma',
  brain: 'brain cancer',
}

// Map ClinicalTrials.gov status to ICTRP recruitment status
const statusMap: Record<string, string> = {
  RECRUITING: 'Recruiting',
  NOT_YET_RECRUITING: 'Not yet recruiting',
  ENROLLING_BY_INVITATION: 'Enrolling by invitation',
  ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
  COMPLETED: 'Completed',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
  WITHDRAWN: 'Withdrawn',
}

interface ICTRPTrial {
  id: string
  nctId: string | null
  title: string
  description: string | null
  status: string | null
  conditions: string[]
  eligibilityCriteria: string | null
  locations: Array<{
    facility: string
    city: string
    state: string
    zip: string
    country: string
  }>
  minimumAge: string | null
  maximumAge: string | null
  primaryRegistry: string | null
  primaryRegisterId: string | null
}

/**
 * Parses XML response from ICTRP API
 * Note: This is a simplified parser. The actual XML structure may vary.
 * You may need to adjust this based on the actual ICTRP API response format.
 */
async function parseICTRPXML(xmlText: string): Promise<ICTRPTrial[]> {
  const trials: ICTRPTrial[] = []
  
  try {
    return new Promise((resolve, reject) => {
      parseString(xmlText, { explicitArray: true }, (err: any, result: any) => {
        if (err) {
          console.error('[ICTRP] XML parsing error:', err)
          // Fallback to simple parsing
          resolve(parseICTRPXMLSimple(xmlText))
          return
        }
        
        // Extract trials from the parsed XML structure
        // ICTRP XML structure may vary - adjust based on actual API response
        const trialEntries = result?.trialsearch?.trial || result?.trial || []
        
        const parsedTrials = trialEntries.map((trial: any) => {
          // Extract basic information
          const id = trial.primary_id?.[0] || trial.trial_id?.[0] || ''
          const nctId = trial.nct_id?.[0] || null
          const title = trial.public_title?.[0] || trial.scientific_title?.[0] || 'Untitled Study'
          const description = trial.scientific_title?.[0] || trial.public_title?.[0] || null
          
          // Extract recruitment status
          const recruitmentStatus = trial.recruitment_status?.[0] || null
          
          // Extract conditions
          const conditions: string[] = []
          if (trial.condition) {
            const conditionArray = Array.isArray(trial.condition) ? trial.condition : [trial.condition]
            conditionArray.forEach((c: any) => {
              const conditionText = typeof c === 'string' ? c : c._ || c
              if (conditionText) conditions.push(conditionText)
            })
          }
          
          // Extract eligibility criteria
          const eligibilityCriteria = trial.eligibility_criteria?.[0] || null
          
          // Extract age information
          const minimumAge = trial.minimum_age?.[0] || null
          const maximumAge = trial.maximum_age?.[0] || null
          
          // Extract locations
          const locations: Array<{
            facility: string
            city: string
            state: string
            zip: string
            country: string
          }> = []
          
          if (trial.location) {
            const locationArray = Array.isArray(trial.location) ? trial.location : [trial.location]
            locationArray.forEach((loc: any) => {
              locations.push({
                facility: loc.facility?.[0] || '',
                city: loc.city?.[0] || '',
                state: loc.state?.[0] || '',
                zip: loc.zip?.[0] || '',
                country: loc.country?.[0] || '',
              })
            })
          }
          
          // Extract registry information
          const primaryRegistry = trial.primary_sponsor?.[0] || null
          const primaryRegisterId = trial.primary_id?.[0] || null
          
          return {
            id: id || primaryRegisterId || 'unknown',
            nctId,
            title,
            description,
            status: recruitmentStatus,
            conditions,
            eligibilityCriteria,
            locations,
            minimumAge,
            maximumAge,
            primaryRegistry,
            primaryRegisterId,
          }
        })
        
        resolve(parsedTrials)
      })
    })
  } catch (error) {
    console.error('[ICTRP] Error parsing XML:', error)
    // Fallback to simple parsing
    return parseICTRPXMLSimple(xmlText)
  }
}

/**
 * Simple XML parser fallback using regex (for when xml2js is not available)
 * This is a basic implementation and may need refinement based on actual XML structure
 */
function parseICTRPXMLSimple(xmlText: string): ICTRPTrial[] {
  const trials: ICTRPTrial[] = []
  
  // This is a very basic parser - you should replace this with proper XML parsing
  // For now, return empty array and log a warning
  console.warn('[ICTRP] Simple XML parser not fully implemented. Please install xml2js for proper parsing.')
  console.warn('[ICTRP] XML response length:', xmlText.length)
  
  // TODO: Implement basic XML parsing or require xml2js package
  // For now, return empty array
  return []
}

/**
 * Searches ICTRP API for clinical trials matching the given criteria
 */
export async function searchICTRPTrials(
  criteria: TrialMatchCriteria
): Promise<ICTRPTrial[]> {
  try {
    console.log('[ICTRP] Searching trials with criteria:', JSON.stringify(criteria, null, 2))
    
    // Build query parameters for ICTRP API
    const queryParts: string[] = []
    
    // Add cancer type to query
    if (criteria.cancerType && criteria.cancerType.trim()) {
      const searchTerm = cancerTypeMap[criteria.cancerType] || criteria.cancerType.trim()
      queryParts.push(searchTerm)
    }
    
    // Add mutations to query
    if (criteria.mutations && criteria.mutations.length > 0) {
      queryParts.push(...criteria.mutations)
    }
    
    // ICTRP API endpoint - this may need to be updated based on actual API documentation
    // The actual endpoint URL should be obtained from WHO ICTRP documentation
    // Common pattern: https://apps.who.int/trialsearch/AdvSearch.aspx or similar
    // You may need to contact ICTRP Secretariat for the exact endpoint and authentication
    const baseUrl = process.env.ICTRP_API_URL || 'https://apps.who.int/trialsearch/AdvSearch.aspx'
    
    // Note: The actual ICTRP API endpoint and query parameters may differ
    // Please refer to ICTRP Web Service documentation for the correct implementation
    
    const params = new URLSearchParams()
    
    // Add search query
    if (queryParts.length > 0) {
      params.append('condition', queryParts.join(' '))
    }
    
    // Add recruitment status filter
    if (criteria.status && criteria.status.length > 0) {
      // ICTRP uses different status values, map them
      const ictrpStatuses = criteria.status
        .map(s => statusMap[s] || s)
        .filter(Boolean)
      if (ictrpStatuses.length > 0) {
        params.append('recr', ictrpStatuses.join('|'))
      }
    } else {
      // Default to recruiting trials
      params.append('recr', 'Recruiting|Not yet recruiting')
    }
    
    // Add age filters if provided
    if (criteria.age) {
      params.append('age', criteria.age.toString())
    }
    
    const apiUrl = `${baseUrl}?${params.toString()}`
    console.log('[ICTRP] API URL:', apiUrl)
    
    // Fetch from ICTRP API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'CCWAI-ClinicalTrials/1.0',
      },
    })
    
    if (!response.ok) {
      console.error('[ICTRP] API error:', response.status, response.statusText)
      throw new Error(`ICTRP API error: ${response.status}`)
    }
    
    const xmlText = await response.text()
    console.log('[ICTRP] Received XML response, length:', xmlText.length)
    
    // Parse XML response
    const trials = await parseICTRPXML(xmlText)
    console.log('[ICTRP] Parsed trials:', trials.length)
    
    return trials
  } catch (error) {
    console.error('[ICTRP] Error searching trials:', error)
    throw error
  }
}

/**
 * Transforms ICTRP trial format to match the expected format used by the application
 */
export function transformICTRPTrial(trial: ICTRPTrial) {
  return {
    id: trial.nctId || trial.id,
    nctId: trial.nctId || trial.id,
    title: trial.title,
    description: trial.description,
    status: trial.status,
    conditions: trial.conditions,
    eligibilityCriteria: trial.eligibilityCriteria,
    locations: trial.locations,
    minimumAge: trial.minimumAge,
    maximumAge: trial.maximumAge,
    source: 'ictrp',
    primaryRegistry: trial.primaryRegistry,
    primaryRegisterId: trial.primaryRegisterId,
  }
}

