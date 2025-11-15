import { prisma } from '@/lib/db/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * Generate sitemap.xml with all static pages and blog posts
 * Writes the sitemap to public/sitemap.xml
 */
export async function generateSitemap(): Promise<{
  success: boolean
  urlCount?: number
  error?: string
}> {
  try {
    // Get base URL from environment or use default
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'https://your-domain.com'
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

    // Generate XML sitemap
    const now = new Date().toISOString()
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    // Helper function to escape XML
    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

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

    // Write to public/sitemap.xml
    // In Next.js, public directory is at the root level
    const publicDir = join(process.cwd(), 'public')
    const sitemapPath = join(publicDir, 'sitemap.xml')

    // Ensure public directory exists (it should, but just in case)
    try {
      await mkdir(publicDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    await writeFile(sitemapPath, xml, 'utf-8')

    const totalUrls = staticPages.length + blogPosts.length

    return {
      success: true,
      urlCount: totalUrls,
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

