import { openai } from './openai'

const MEDICAL_DISCLAIMER = '\n\n⚠️ IMPORTANT: This information is for educational purposes only and does not constitute medical advice. Consult your healthcare provider for personalized medical guidance.'

export async function generateLaypersonSummary(content: string): Promise<string> {
  const prompt = `Summarize the following medical research paper in plain, easy-to-understand language for a non-medical audience (explain like I'm 12 years old). Focus on:
1. What the research found
2. Why it matters
3. What it might mean for patients

Content to summarize:
${content}

Provide a clear, concise summary in 2-3 paragraphs.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains medical research in plain language for patients and caregivers. Always be clear, compassionate, and accurate.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0].message.content + MEDICAL_DISCLAIMER
  } catch (error) {
    console.error('Error generating layperson summary:', error)
    throw error
  }
}

export async function generateClinicalSummary(content: string): Promise<string> {
  const prompt = `Summarize the following medical research paper for a clinical/medical audience. Include:
1. Key findings and methodology
2. Statistical significance and outcomes
3. Clinical implications
4. Limitations and future directions

Content to summarize:
${content}

Provide a concise clinical summary suitable for healthcare professionals.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a medical research assistant that provides accurate, detailed summaries for healthcare professionals.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    })

    return response.choices[0].message.content + MEDICAL_DISCLAIMER
  } catch (error) {
    console.error('Error generating clinical summary:', error)
    throw error
  }
}

