import { openai } from './openai'
import { ExplanationLevel, CancerType } from '@/lib/types'

const MEDICAL_DISCLAIMER = '\n\n⚠️ IMPORTANT: This information is for educational purposes only and does not constitute medical advice. Always consult your healthcare provider for personalized medical guidance and before making any treatment decisions.'

export async function generateChatResponse(
  question: string,
  explanationLevel: ExplanationLevel,
  cancerType?: CancerType,
  context?: { papers?: any[]; trials?: any[] }
): Promise<{ response: string; citations: any[] }> {
  const systemPrompt = explanationLevel === 'layperson'
    ? `You are a compassionate and knowledgeable assistant helping cancer patients and caregivers understand complex medical information. Explain things in simple, clear language (explain like I'm 12 years old). Be empathetic, supportive, and always emphasize that you are providing information, not medical advice.`
    : `You are a medical research assistant providing information for healthcare professionals. Provide detailed, accurate, and clinically relevant information. Always emphasize that this is informational and does not replace professional medical judgment.`

  const userContext = cancerType
    ? `The user is focused on ${cancerType} cancer. `
    : ''
  
  const relevantContext = context?.papers?.length || context?.trials?.length
    ? `\n\nRelevant context from recent research:\n${JSON.stringify(context, null, 2)}`
    : ''

  const prompt = `${userContext}User question: ${question}${relevantContext}\n\nPlease provide a helpful, accurate response. ${explanationLevel === 'layperson' ? 'Use simple language and avoid medical jargon.' : 'Use appropriate medical terminology.'}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const citations: any[] = []
    if (context?.papers) {
      citations.push(...context.papers.slice(0, 3))
    }
    if (context?.trials) {
      citations.push(...context.trials.slice(0, 2))
    }

    return {
      response: response.choices[0].message.content + MEDICAL_DISCLAIMER,
      citations,
    }
  } catch (error) {
    console.error('Error generating chat response:', error)
    throw error
  }
}

