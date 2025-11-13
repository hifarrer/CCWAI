'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  source: string | null
  publishedAt: Date | null
  cancerTypes: string[]
  summary: string | null
}

interface ResearchPaper {
  id: string
  pubmedId: string
  title: string
  journal: string | null
  publicationDate: Date | null
  cancerTypes: string[]
  treatmentTypes: string[]
  authors: string[]
}

interface ChatMessage {
  id: string
  text: string
  timestamp: Date
}

const MAX_MESSAGES = 300
const MESSAGE_INTERVAL = 8000 // 8 seconds

export function AIResearch() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [articles, setArticles] = useState<{ news: NewsArticle[]; papers: ResearchPaper[] }>({ news: [], papers: [] })
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const messageIndexRef = useRef<number>(0)
  const generatedMessagesRef = useRef<ChatMessage[]>([])

  // Fetch articles on mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/ai-research/articles?limit=50')
        if (!response.ok) throw new Error('Failed to fetch articles')
        const data = await response.json()
        setArticles({ news: data.newsArticles || [], papers: data.researchPapers || [] })
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [])

  // Generate random chat messages based on articles
  const generateMessages = useCallback((): ChatMessage[] => {
    const allMessages: ChatMessage[] = []
    const newsArticles = articles.news
    const researchPapers = articles.papers

    if (newsArticles.length === 0 && researchPapers.length === 0) {
      return []
    }

    // Collect all unique cancer types
    const allCancerTypes = new Set<string>()
    newsArticles.forEach(article => article.cancerTypes.forEach(type => allCancerTypes.add(type)))
    researchPapers.forEach(paper => paper.cancerTypes.forEach(type => allCancerTypes.add(type)))
    const cancerTypesArray = Array.from(allCancerTypes)

    // Generate messages for news articles
    newsArticles.slice(0, 20).forEach((article, index) => {
      const messageTemplates = [
        `Researching "${article.title.substring(0, 60)}${article.title.length > 60 ? '...' : ''}"...`,
        `Found interesting news: ${article.title.substring(0, 50)}${article.title.length > 50 ? '...' : ''}`,
        `Analyzing latest news article about ${article.cancerTypes[0] || 'cancer research'}...`,
        `Reviewing news from ${article.source || 'recent sources'}...`,
        `New information discovered: ${article.title.substring(0, 45)}${article.title.length > 45 ? '...' : ''}`,
      ]
      const randomTemplate = messageTemplates[Math.floor(Math.random() * messageTemplates.length)]
      allMessages.push({
        id: `news-${article.id}-${index}-${Date.now()}`,
        text: randomTemplate,
        timestamp: new Date(),
      })
    })

    // Generate messages for research papers
    researchPapers.slice(0, 20).forEach((paper, index) => {
      const cancerType = paper.cancerTypes[0] || 'cancer'
      const journal = paper.journal || 'research journal'
      const messageTemplates = [
        `Reading research paper: "${paper.title.substring(0, 55)}${paper.title.length > 55 ? '...' : ''}"`,
        `Found very interesting information about ${cancerType} in ${journal}...`,
        `Analyzing study on ${cancerType} treatment approaches...`,
        `Reviewing publication: ${paper.title.substring(0, 50)}${paper.title.length > 50 ? '...' : ''}`,
        `Discovering new insights about ${cancerType} from recent research...`,
        `Examining findings from ${paper.authors[0] || 'researchers'}...`,
        `Processing data on ${paper.treatmentTypes[0] || 'treatment'} for ${cancerType}...`,
      ]
      const randomTemplate = messageTemplates[Math.floor(Math.random() * messageTemplates.length)]
      allMessages.push({
        id: `paper-${paper.id}-${index}-${Date.now()}`,
        text: randomTemplate,
        timestamp: new Date(),
      })
    })

    // Add general research messages
    if (cancerTypesArray.length > 0) {
      const generalMessages = [
        `Compiling latest research on ${cancerTypesArray[Math.floor(Math.random() * cancerTypesArray.length)]}...`,
        `Cross-referencing multiple studies for comprehensive analysis...`,
        `Identifying emerging trends in cancer research...`,
        `Synthesizing information from recent publications...`,
        `Building knowledge base from latest findings...`,
        `Connecting insights across different research domains...`,
        `Updating research database with new discoveries...`,
      ]
      generalMessages.forEach((text, index) => {
        allMessages.push({
          id: `general-${index}-${Date.now()}`,
          text,
          timestamp: new Date(),
        })
      })
    }

    // Shuffle messages for randomness
    for (let i = allMessages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allMessages[i], allMessages[j]] = [allMessages[j], allMessages[i]]
    }

    return allMessages
  }, [articles])

  // Start the chat animation
  useEffect(() => {
    if (loading || (articles.news.length === 0 && articles.papers.length === 0)) return

    const generatedMessages = generateMessages()
    if (generatedMessages.length === 0) return

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Reset state
    setMessages([])
    messageIndexRef.current = 0
    generatedMessagesRef.current = generatedMessages

    // Start adding messages
    intervalRef.current = setInterval(() => {
      setMessages((msgs) => {
        // Clear and restart if we reach max messages
        if (msgs.length >= MAX_MESSAGES) {
          messageIndexRef.current = 0
          generatedMessagesRef.current = generateMessages()
          return []
        }

        // If we've shown all messages, regenerate
        if (messageIndexRef.current >= generatedMessagesRef.current.length) {
          const newMessages = generateMessages()
          if (newMessages.length > 0) {
            generatedMessagesRef.current = newMessages
            messageIndexRef.current = 0
            // Update timestamp to current time when message is displayed
            return [{ ...newMessages[0], timestamp: new Date() }]
          }
          return msgs
        }

        const newMessage = generatedMessagesRef.current[messageIndexRef.current]
        messageIndexRef.current++
        // Update timestamp to current time when message is displayed
        return [...msgs, { ...newMessage, timestamp: new Date() }]
      })
    }, MESSAGE_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [loading, articles, generateMessages])

  // Auto-scroll to bottom when new messages arrive (only within widget)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-purple">
              <Bot size={14} />
            </div>
            <span>AI Research</span>
          </div>
        </div>
        <div className="widget-subtitle">Simulated AI insights summarizing the latest articles.</div>
        <div 
          className="chat-container"
          ref={scrollContainerRef}
        >
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Loading research data...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Initializing research assistant...
            </div>
          ) : (
            messages.slice(-5).map((message, index, array) => (
              <div 
                key={message.id}
                className="chat-message"
              >
                <div className="chat-avatar">
                  <Bot size={20} />
                </div>
                <div className="chat-bubble">
                  {message.text}
                  {index === array.length - 1 && (
                    <span className="thinking-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  )}
                  <div className="chat-timestamp">
                    {message.timestamp.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

