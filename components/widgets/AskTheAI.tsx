'use client'

import { useState } from 'react'
import { ExplanationLevel } from '@/lib/types'

interface Message {
  id: string
  question: string
  response: string
  explanationLevel: ExplanationLevel
  timestamp: Date
}

export function AskTheAI() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('layperson')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!question.trim()) return

    const currentQuestion = question.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      question: currentQuestion,
      response: '',
      explanationLevel,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setLoading(true)
    setQuestion('')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          explanationLevel,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }
      
      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        question: currentQuestion,
        response: data.response || 'Sorry, I could not generate a response. Please try again.',
        explanationLevel,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        question: currentQuestion,
        response: 'Sorry, there was an error processing your question. Please try again.',
        explanationLevel,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null

  return (
    <div className="widget widget-fixed">
      <div className="widget-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="widget-header">
          <div className="widget-title">
            <div className="widget-pill pill-blue">💬</div>
            <span>Ask the AI</span>
          </div>
        </div>
        <div className="widget-subtitle">Get answers about cancer research in plain English.</div>

        <div className="chip-row">
          <button
            className={`btn btn-secondary ${explanationLevel === 'layperson' ? 'opacity-100' : 'opacity-60'}`}
            onClick={() => setExplanationLevel('layperson')}
          >
            Explain like I'm 12
          </button>
          <button
            className={`btn btn-secondary ${explanationLevel === 'clinical' ? 'opacity-100' : 'opacity-60'}`}
            onClick={() => setExplanationLevel('clinical')}
          >
            Explain for my oncologist
          </button>
        </div>

        <label className="field-label">Your question</label>
        <input
          className="field-input"
          placeholder="What is melanoma?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />

        {latestMessage?.response && (
          <div className="mt-2">
            <div className="chip" style={{ background: '#e6f9ee', color: 'var(--brand-green)', border: 'none' }}>
              AI Response
            </div>
            <p className="text-[0.8rem] mt-1 text-[var(--text-main)]">
              {latestMessage.response}
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center text-muted-foreground text-sm mt-2">Thinking...</div>
        )}

        <p className="footnote">
          This assistant does not replace medical advice from your healthcare provider.
        </p>
      </div>
    </div>
  )
}

