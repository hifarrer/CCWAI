import { prisma } from '@/lib/db/client'

/**
 * Generate sitemap XML content with all static pages and blog posts
 * Note: On platforms like Render, the filesystem is ephemeral, so we use
 * a dynamic route handler at app/sitemap.xml/route.ts instead of writing to disk
 */
export async function generateSitemapXml(): Promise<string> {
  // Get base URL from environment or use default
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'https://curecancerwithai.com'
  const cleanBaseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash

  // Static pages that should be in the sitemap
  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' }, // Home page
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/blog', priority: '0.9', changefreq: 'weekly' },
    { path: '/plans', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/donations', priority: '0.7', changefreq: 'monthly' },
    { path: '/premiumfree', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { path: '/terms-of-use', priority: '0.5', changefreq: 'yearly' },
    { path: '/checkout/success', priority: '0.3', changefreq: 'monthly' },
    { path: '/checkout/cancel', priority: '0.3', changefreq: 'monthly' },
  ]

  // Get all blog posts
  const blogPosts = await prisma.blogPost.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  })

  // Helper function to escape XML
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // Generate XML sitemap
  const now = new Date().toISOString()
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  // Add static pages
  for (const page of staticPages) {
    const lastmod = now
    const url = `${cleanBaseUrl}${page.path}`
    xml += `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
  }

  // Add blog posts
  for (const post of blogPosts) {
    const lastmod = post.updatedAt.toISOString()
    const url = `${cleanBaseUrl}/blog/${post.slug}`
    xml += `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }

  xml += `</urlset>`
  return xml
}

/**
 * Generate sitemap and return metadata
 * Used by the cron job to verify sitemap generation
 */
export async function generateSitemap(): Promise<{
  success: boolean
  urlCount?: number
  error?: string
}> {
  try {
    const xml = await generateSitemapXml()
    
    // Count URLs in the XML (static pages + blog posts)
    const urlMatches = xml.match(/<url>/g)
    const urlCount = urlMatches ? urlMatches.length : 0

    return {
      success: true,
      urlCount,
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

