import { Resend } from 'resend'
import { prisma } from '@/lib/db/client'

const resend = new Resend(process.env.RESEND_API_KEY)

const SITE_URL = process.env.NEXTAUTH_URL || 'https://curecancerwithai.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@curecancerwithai.com'
const LOGO_URL = 'https://res.cloudinary.com/dqemas8ht/image/upload/v1762823833/CCWAI_1_stoio5.png'

interface Article {
  id: string
  title: string
  url?: string
  publishedAt?: Date | null
  source?: string | null
  summary?: string | null
  abstract?: string | null
  journal?: string | null
  authors?: string[]
  cancerTypes?: string[]
}

interface EmailAlertData {
  articles: Article[]
  alertType: 'researchArticles' | 'news' | 'clinicalTrials' | 'aiInsights' | 'potentialCures'
  userName?: string | null
  cancerType?: string | null
}

function getAlertTypeLabel(alertType: string): string {
  const labels: Record<string, string> = {
    researchArticles: 'Research Articles',
    news: 'News',
    clinicalTrials: 'Clinical Trials',
    aiInsights: 'AI Insights',
    potentialCures: 'Potential Cures',
  }
  return labels[alertType] || alertType
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function truncateText(text: string | null | undefined, maxLength: number = 200): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function generateEmailHTML(data: EmailAlertData): string {
  const { articles, alertType, userName, cancerType } = data
  const alertLabel = getAlertTypeLabel(alertType)
  const greeting = userName ? `Hi ${userName},` : 'Hi there,'
  const scopeText = cancerType
    ? `Here are new ${alertLabel.toLowerCase()} related to ${cancerType} cancer:`
    : `Here are new ${alertLabel.toLowerCase()} we found:`

  const articlesHTML = articles
    .slice(0, 10) // Limit to 10 articles per email
    .map((article) => {
      const title = article.title || 'Untitled'
      const url = article.url || `${SITE_URL}/articles`
      const date = formatDate(article.publishedAt)
      const source = article.source || article.journal || ''
      const summary = article.summary || article.abstract || ''
      const truncatedSummary = truncateText(summary, 250)
      const authors = article.authors?.slice(0, 3).join(', ') || ''
      const cancerTypes = article.cancerTypes?.join(', ') || ''

      return `
        <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e4e7f2;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1c1c24; line-height: 1.4;">
            <a href="${url}" style="color: #4db5ff; text-decoration: none;">${title}</a>
          </h3>
          ${date || source ? `
            <div style="margin-bottom: 8px; font-size: 13px; color: #7a7a8c;">
              ${date ? `<span>${date}</span>` : ''}
              ${date && source ? ' • ' : ''}
              ${source ? `<span>${source}</span>` : ''}
            </div>
          ` : ''}
          ${authors ? `
            <div style="margin-bottom: 8px; font-size: 13px; color: #7a7a8c;">
              <strong>Authors:</strong> ${authors}${article.authors && article.authors.length > 3 ? ' et al.' : ''}
            </div>
          ` : ''}
          ${cancerTypes ? `
            <div style="margin-bottom: 8px; font-size: 13px; color: #7a7a8c;">
              <strong>Cancer Types:</strong> ${cancerTypes}
            </div>
          ` : ''}
          ${truncatedSummary ? `
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #1c1c24; line-height: 1.6;">
              ${truncatedSummary}
            </p>
          ` : ''}
          <a href="${url}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: linear-gradient(135deg, #4db5ff, #a762d9); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; font-weight: 600;">
            Read More →
          </a>
        </div>
      `
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${alertLabel} - Cure Cancer With AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f7f8fb; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f7f8fb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 26px; box-shadow: 0 10px 25px rgba(16, 24, 40, 0.06); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; background: radial-gradient(circle at top right, rgba(77, 181, 255, 0.1), rgba(193, 125, 219, 0.05), transparent 55%);">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${LOGO_URL}" alt="Cure Cancer with AI" style="max-width: 200px; height: auto;" />
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1c1c24; text-align: center;">
                New ${alertLabel}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #1c1c24;">
                ${greeting}
              </p>
              <p style="margin: 0 0 30px 0; font-size: 15px; color: #7a7a8c;">
                ${scopeText}
              </p>
              
              ${articlesHTML}
              
              ${articles.length > 10 ? `
                <div style="margin-top: 24px; padding: 16px; background-color: #f5f8ff; border-radius: 18px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #7a7a8c;">
                    And ${articles.length - 10} more ${articles.length - 10 === 1 ? 'article' : 'articles'} available on our website.
                  </p>
                  <a href="${SITE_URL}/dashboard" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: linear-gradient(135deg, #4db5ff, #a762d9); color: white; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600;">
                    View All Articles
                  </a>
                </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f7f8fb; border-top: 1px solid #e4e7f2;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #7a7a8c; text-align: center;">
                You're receiving this email because you've enabled ${alertLabel.toLowerCase()} alerts in your preferences.
              </p>
              <p style="margin: 0; font-size: 12px; color: #7a7a8c; text-align: center;">
                <a href="${SITE_URL}/profile" style="color: #4db5ff; text-decoration: none;">Manage your alert preferences</a> | 
                <a href="${SITE_URL}" style="color: #4db5ff; text-decoration: none;">Visit Cure Cancer With AI</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #7a7a8c; text-align: center;">
                © ${new Date().getFullYear()} curecancerwithai.com. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function sendAlertEmail(
  userId: string,
  email: string,
  data: EmailAlertData,
  skipRecordCreation: boolean = false
): Promise<{ 
  success: boolean
  error?: string
  emailId?: string
  debug?: {
    from: string
    to: string
    subject: string
    resendResponse?: any
  }
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const html = generateEmailHTML(data)
    const alertLabel = getAlertTypeLabel(data.alertType)
    const subject = `New ${alertLabel} - Cure Cancer With AI`

    console.log(`[Email Debug] Attempting to send email:`, {
      from: FROM_EMAIL,
      to: email,
      subject,
      alertType: data.alertType,
      articlesCount: data.articles.length,
    })

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    })

    console.log(`[Email Debug] Resend API response:`, {
      success: !result.error,
      error: result.error,
      data: result.data,
    })

    if (result.error) {
      console.error('[Email Debug] Resend API error:', result.error)
      return { 
        success: false, 
        error: result.error.message,
        debug: {
          from: FROM_EMAIL,
          to: email,
          subject,
          resendResponse: result.error,
        }
      }
    }

    const emailId = result.data?.id || 'unknown'
    console.log(`[Email Debug] Email sent successfully. Email ID: ${emailId}`)

    // Record that we sent this email (skip in test mode or if flag is set)
    if (!skipRecordCreation) {
      // Verify user exists before creating alert record
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) {
        console.warn(`User ${userId} not found, skipping alert record creation`)
        return { success: true }
      }

      for (const article of data.articles) {
        try {
          await prisma.userEmailAlert.create({
            data: {
              userId,
              alertType: data.alertType,
              recordId: article.id,
              recordType: article.url ? 'NewsArticle' : 'ResearchPaper',
            },
          })
        } catch (error: any) {
          // Ignore unique constraint errors (already sent)
          if (error.code === 'P2002') {
            // Already exists, that's fine
            continue
          }
          // Ignore foreign key constraint errors (user might have been deleted)
          if (error.code === 'P2003') {
            console.warn(`Foreign key constraint error for user ${userId}, skipping alert record`)
            continue
          }
          console.error('Error recording email alert:', error)
        }
      }
    }

    return { 
      success: true,
      emailId,
      debug: {
        from: FROM_EMAIL,
        to: email,
        subject,
        resendResponse: result.data,
      }
    }
  } catch (error) {
    console.error('[Email Debug] Error sending alert email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        from: FROM_EMAIL,
        to: email,
        subject: `New ${getAlertTypeLabel(data.alertType)} - Cure Cancer With AI`,
      }
    }
  }
}

