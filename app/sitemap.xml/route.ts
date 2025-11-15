import { NextResponse } from 'next/server'
import { generateSitemapXml } from '@/lib/seo/sitemap-generator'

/**
 * Dynamic sitemap.xml route
 * Generates sitemap on-demand with all static pages and blog posts
 * This is the recommended approach for Next.js on platforms like Render
 * where the filesystem is ephemeral
 * 
 * Accessible at: https://curecancerwithai.com/sitemap.xml
 */
export async function GET() {
  try {
    const xml = await generateSitemapXml()

    // Return XML response with proper headers
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return a minimal sitemap on error
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'https://curecancerwithai.com'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${cleanBaseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new NextResponse(minimalXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  }
}

