'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Brain } from 'lucide-react'
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

    const userMessage: Message = {
      id: Date.now().toString(),
      question,
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
          question,
          explanationLevel,
        }),
      })
      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        question,
        response: data.response,
        explanationLevel,
        timestamp: new Date(),
      }
      setMessages([...messages, userMessage, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ask the AI
          </CardTitle>
          <CardDescription>
            Get answers about cancer research in plain English
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="flex gap-2">
          <Button
            variant={explanationLevel === 'layperson' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setExplanationLevel('layperson')}
          >
            Explain like I'm 12
          </Button>
          <Button
            variant={explanationLevel === 'clinical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setExplanationLevel('clinical')}
          >
            Explain for my oncologist
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Ask me anything about cancer research, treatments, or clinical trials.
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium">You:</p>
                  <p className="text-sm">{message.question}</p>
                </div>
                {message.response && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium">AI:</p>
                    <p className="text-sm whitespace-pre-wrap">{message.response}</p>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="text-center text-muted-foreground text-sm">Thinking...</div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={loading || !question.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p className="italic">
            This AI provides information only and does not replace medical advice from your healthcare provider.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

