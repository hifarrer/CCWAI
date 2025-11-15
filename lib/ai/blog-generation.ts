import { openai } from './openai'
import { prisma } from '@/lib/db/client'

/**
 * Generate a blog post about using AI to search for the cure of cancer
 * Uses OpenAI GPT-4o mini to create engaging, informative content
 */
export async function generateBlogPost(): Promise<{
  success: boolean
  postId?: string
  error?: string
}> {
  try {
    // Generate blog post content using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable science writer specializing in cancer research and artificial intelligence. 
          Write engaging, informative blog posts about how AI is being used to search for cures for cancer. 
          Your writing should be accessible to a general audience while still being scientifically accurate. 
          Focus on recent developments, breakthroughs, and the potential of AI in cancer research.`,
        },
        {
          role: 'user',
          content: `Write a comprehensive blog post (800-1200 words) about using AI to search for the cure of cancer. 
          
          Start with an H1 heading as the title, then include:
          - An engaging introduction
          - Current applications of AI in cancer research
          - Recent breakthroughs and discoveries
          - The potential impact of AI on finding cancer cures
          - Future prospects
          - A thoughtful conclusion
          
          Format the content in HTML with:
          - An H1 tag for the title at the beginning
          - H2 tags for main sections
          - H3 tags for subsections
          - Paragraph tags (<p>) for body text
          - <strong> and <em> tags for emphasis where appropriate
          
          Make it inspiring and hopeful while being realistic about the challenges.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const generatedContent = completion.choices[0]?.message?.content

    if (!generatedContent) {
      return {
        success: false,
        error: 'Failed to generate blog post content',
      }
    }

    // Extract title and content from the generated text
    // Try to find title in various formats
    let title = 'How AI is Revolutionizing the Search for Cancer Cures'
    let content = generatedContent

    // Try to extract title from H1 tag
    const h1Match = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i)
    if (h1Match) {
      title = h1Match[1].trim()
      content = generatedContent.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim()
    } else {
      // Try markdown format
      const markdownTitleMatch = generatedContent.match(/^#\s+(.+)$/m)
      if (markdownTitleMatch) {
        title = markdownTitleMatch[1].trim()
        content = generatedContent.replace(/^#\s+.+$/m, '').trim()
      } else {
        // Try first line as title
        const firstLineMatch = generatedContent.match(/^(.+?)\n\n/)
        if (firstLineMatch && firstLineMatch[1].length < 100) {
          title = firstLineMatch[1].trim()
          content = generatedContent.replace(/^.+?\n\n/, '').trim()
        }
      }
    }

    // Clean up content - ensure proper HTML formatting
    if (!content.includes('<p>') && !content.includes('<h2>')) {
      // Split into paragraphs and wrap
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
      content = paragraphs.map(p => {
        const trimmed = p.trim()
        if (!trimmed) return ''
        
        // Check for markdown headings
        const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          const text = headingMatch[2]
          return `<h${level}>${text}</h${level}>`
        }
        
        // Check if it's already HTML
        if (trimmed.startsWith('<')) {
          return trimmed
        }
        
        // Wrap as paragraph
        return `<p>${trimmed}</p>`
      }).filter(p => p).join('\n\n')
    }

    // Clean up any remaining markdown-style formatting
    content = content
      .replace(/^#+\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Generate excerpt (first 200 characters of plain text)
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    const excerpt = plainText.substring(0, 200).replace(/\s+\S*$/, '') + '...'

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100)
    
    // Ensure slug is unique by appending timestamp if needed
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    })

    const finalSlug = existingPost 
      ? `${slug}-${Date.now()}` 
      : slug

    // Save to database
    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        content,
        excerpt,
        slug: finalSlug,
        publishedAt: new Date(),
      },
    })

    return {
      success: true,
      postId: blogPost.id,
    }
  } catch (error) {
    console.error('Error generating blog post:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

