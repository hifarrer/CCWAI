import Parser from 'rss-parser'
import { prisma } from '@/lib/db/client'
import { generateLaypersonSummary } from '@/lib/ai/summarization'

const parser = new Parser()

export async function ingestNewsFromRSS() {
  const errors: Error[] = []
  let ingested = 0

  // Fetch active RSS feeds from database
  const rssFeeds = await prisma.rssFeed.findMany({
    where: {
      isActive: true,
    },
  })

  if (rssFeeds.length === 0) {
    console.warn('No active RSS feeds found in database')
    return { ingested: 0, errors: [] }
  }

  for (const rssFeed of rssFeeds) {
    const feedUrl = rssFeed.url
    try {
      const parsedFeed = await parser.parseURL(feedUrl)

      for (const item of parsedFeed.items.slice(0, 10)) {
        try {
          // Check if article already exists
          const existing = await prisma.newsArticle.findUnique({
            where: { url: item.link || undefined },
          })

          if (existing) {
            continue
          }

          // Extract cancer types from title and content
          const content = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`
          const cancerTypes = extractCancerTypes(content)
          
          // Only save articles that are cancer-related
          if (cancerTypes.length === 0 && !isCancerRelated(content)) {
            continue // Skip non-cancer related articles
          }

          // Generate summary if content exists
          const summary = item.contentSnippet || item.content
            ? await generateLaypersonSummary(item.contentSnippet || item.content || '')
            : null

          await prisma.newsArticle.create({
            data: {
              title: item.title || 'Untitled',
              content: item.content || item.contentSnippet || null,
              source: parsedFeed.title || feedUrl,
              url: item.link || null,
              publishedAt: item.pubDate ? new Date(item.pubDate) : null,
              cancerTypes,
              tags: extractTags(content),
              summary,
            },
          })

          await prisma.dataIngestionLog.create({
            data: {
              source: 'rss',
              recordId: item.link || item.guid || item.title || '',
              recordType: 'news_article',
              action: 'created',
              metadata: { feedUrl, feedId: rssFeed.id, feedName: rssFeed.name },
            },
          })

          ingested++
        } catch (itemError) {
          console.error('Error ingesting news item:', itemError)
          errors.push(itemError as Error)
        }
      }
    } catch (feedError) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, feedError)
      errors.push(feedError as Error)
    }
  }

  return { ingested, errors }
}

function extractCancerTypes(content: string): string[] {
  const contentLower = content.toLowerCase()
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
    'tumor': 'other',
    'tumour': 'other',
    'oncology': 'other',
    'carcinoma': 'other',
  }

  Object.entries(cancerKeywords).forEach(([keyword, type]) => {
    if (contentLower.includes(keyword.toLowerCase())) {
      cancerTypes.push(type)
    }
  })

  return [...new Set(cancerTypes)]
}

function isCancerRelated(content: string): boolean {
  const contentLower = content.toLowerCase()
  
  // Check for general cancer-related keywords
  const cancerKeywords = [
    'cancer',
    'tumor',
    'tumour',
    'oncology',
    'carcinoma',
    'malignancy',
    'chemotherapy',
    'radiation therapy',
    'immunotherapy',
    'cancer treatment',
    'cancer research',
    'cancer patient',
    'cancer diagnosis',
  ]
  
  return cancerKeywords.some(keyword => contentLower.includes(keyword))
}

function extractTags(content: string): string[] {
  const tags: string[] = []
  const contentLower = content.toLowerCase()

  if (contentLower.includes('fda')) tags.push('FDA')
  if (contentLower.includes('approval')) tags.push('Approval')
  if (contentLower.includes('trial')) tags.push('Trial')
  if (contentLower.includes('breakthrough')) tags.push('Breakthrough')

  return tags
}

