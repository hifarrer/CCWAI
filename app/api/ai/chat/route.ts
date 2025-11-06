import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { generateChatResponse } from '@/lib/ai/chat'
import { ChatMessage } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChatMessage = await request.json()
    const { question, explanationLevel, cancerType } = body

    // Fetch relevant context based on user's cancer type
    const context: any = {}
    if (cancerType) {
      const papers = await prisma.researchPaper.findMany({
        where: {
          cancerTypes: { has: cancerType },
          AND: [
            {
              abstract: {
                not: null,
              },
            },
            {
              abstract: {
                not: '',
              },
            },
            {
              NOT: {
                abstract: {
                  contains: 'No abstract available',
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        take: 3,
        orderBy: { publicationDate: 'desc' },
      })
      context.papers = papers

      const trials = await prisma.clinicalTrial.findMany({
        where: {
          conditions: { has: cancerType },
          status: { in: ['RECRUITING', 'NOT_YET_RECRUITING'] },
        },
        take: 2,
        orderBy: { updatedAt: 'desc' },
      })
      context.trials = trials
    }

    // Get user's cancer type from profile if not provided
    let userCancerType = cancerType
    if (!userCancerType && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { cancerType: true },
      })
      userCancerType = user?.cancerType as any
    }

    const { response, citations } = await generateChatResponse(
      question,
      explanationLevel,
      userCancerType,
      context
    )

    // Store chat session
    await prisma.aiChatSession.create({
      data: {
        userId: session.user.id,
        message: question,
        response,
        cancerTypeContext: userCancerType || null,
        explanationLevel,
        citations: citations || [],
      },
    })

    return NextResponse.json({ response, citations })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

