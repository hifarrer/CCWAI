import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

// Rate limiting: 10 requests/second with API key, 3 without
// Add delay between requests to respect rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  // These should be registered with NCBI for production use
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const database = searchParams.get('database') || 'pubmed'
    const queryType = searchParams.get('queryType') || 'esearch'
    const term = searchParams.get('term')
    const ids = searchParams.get('ids')
    const apiKey = process.env.NCBI_API_KEY

    // Validate inputs
    if (queryType === 'esearch' && !term) {
      return NextResponse.json(
        { error: 'Search term is required for ESearch' },
        { status: 400 }
      )
    }

    if ((queryType === 'esummary' || queryType === 'efetch') && !ids) {
      return NextResponse.json(
        { error: 'IDs are required for ESummary and EFetch' },
        { status: 400 }
      )
    }

    // Add small delay to respect rate limits
    await delay(100) // 100ms delay = max 10 requests/second

    let result: any

    switch (queryType) {
      case 'esearch': {
        const params: Record<string, string> = {
          db: database,
          term: term!,
          retmax: '100', // Limit results to 100
        }
        
        const response = await queryNCBI('esearch', params, apiKey)
        // ESearch returns { esearchresult: { ... } }
        result = response.esearchresult || response
        break
      }

      case 'esummary': {
        const params: Record<string, string> = {
          db: database,
          id: ids!,
        }
        
        const response = await queryNCBI('esummary', params, apiKey)
        // ESummary returns { result: { uids: [...], "id1": {...}, ... } }
        result = response.result || response
        break
      }

      case 'efetch': {
        // For EFetch, determine rettype based on database
        let rettype = 'abstract'
        let retmode = 'xml'
        
        if (database === 'pubmed') {
          rettype = 'abstract'
          retmode = 'xml'
        } else if (database === 'protein' || database === 'nucleotide') {
          rettype = 'fasta'
          retmode = 'text'
        } else {
          retmode = 'xml'
        }

        const params: Record<string, string> = {
          db: database,
          id: ids!,
          rettype,
          retmode,
        }
        
        // EFetch returns XML or text, not JSON
        result = await queryNCBI('efetch', params, apiKey, false)
        
        // Wrap in object for consistent response format
        result = { 
          data: result, 
          format: retmode,
          database 
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unsupported query type: ${queryType}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Error querying NCBI:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to query NCBI' },
      { status: 500 }
    )
  }
}

