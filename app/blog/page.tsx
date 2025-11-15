import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/client'
import Link from 'next/link'

export const revalidate = 3600 // Revalidate every hour

async function getBlogPosts() {
  try {
    const posts = await db.blogPost.findMany({
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50,
    })
    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground">
              Insights on using AI to search for the cure of cancer
            </p>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No blog posts yet. Check back soon for updates!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Link href={`/blog/${post.slug}`}>
                      <CardTitle className="text-2xl hover:text-pink-600 transition-colors cursor-pointer">
                        {post.title}
                      </CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {post.excerpt ? (
                      <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    ) : (
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {post.content.substring(0, 200)}...
                      </p>
                    )}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-pink-600 hover:text-pink-700 font-medium"
                    >
                      Read more →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

