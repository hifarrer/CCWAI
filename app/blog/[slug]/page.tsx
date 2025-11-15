import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 3600 // Revalidate every hour

async function getBlogPost(slug: string) {
  try {
    const post = await db.blogPost.findUnique({
      where: { slug },
    })
    return post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link
            href="/blog"
            className="text-pink-600 hover:text-pink-700 font-medium inline-block mb-4"
          >
            ← Back to Blog
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl mb-4">{post.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-lg max-w-none text-muted-foreground [&>p]:mb-4 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-foreground [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-foreground [&>strong]:font-semibold [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

