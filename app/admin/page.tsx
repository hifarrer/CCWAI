'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CancerTypeBarChart, CancerTypePieChart } from '@/components/admin/CancerTypeChart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UsageStats {
  totalUsers: number
  totalCheckIns: number
  totalChatSessions: number
  activeUsersLast30Days: number
  newUsersLast30Days: number
  totalPapers: number
  cancerTypeStats: Array<{
    cancerType: string
    count: number
    percentage: number
  }>
  totalFdaApprovals?: number
  fdaCancerTypeStats?: Array<{
    cancerType: string
    count: number
    percentage: number
  }>
}

interface User {
  id: string
  name: string | null
  email: string | null
  cancerType: string | null
  zipCode: string | null
  planId: string | null
  plan: {
    id: string
    name: string
  } | null
  createdAt: string
  _count: {
    dailyCheckins: number
    aiChatSessions: number
  }
}

interface SubscriptionPlan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
}

interface RssFeed {
  id: string
  url: string
  name: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface NcbiQuery {
  id: string
  query: string
  name: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ResearchPaper {
  id: string
  pubmedId: string
  title: string
  abstract: string | null
  authors: string[]
  journal: string | null
  publicationDate: string | null
  cancerTypes: string[]
  treatmentTypes: string[]
  keywords: string[]
  fullTextUrl: string | null
  summaryPlain: string | null
  summaryClinical: string | null
  ingestedAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', cancerType: '', zipCode: '', planId: '' })
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([])
  const [editingRssFeed, setEditingRssFeed] = useState<RssFeed | null>(null)
  const [rssFeedForm, setRssFeedForm] = useState({ url: '', name: '', description: '', isActive: true })
  const [showAddRssFeed, setShowAddRssFeed] = useState(false)
  const [ncbiQueries, setNcbiQueries] = useState<NcbiQuery[]>([])
  const [editingNcbiQuery, setEditingNcbiQuery] = useState<NcbiQuery | null>(null)
  const [ncbiQueryForm, setNcbiQueryForm] = useState({ query: '', name: '', description: '', isActive: true })
  const [showAddNcbiQuery, setShowAddNcbiQuery] = useState(false)
  const [articles, setArticles] = useState<ResearchPaper[]>([])
  const [selectedArticle, setSelectedArticle] = useState<ResearchPaper | null>(null)
  const [articleFilters, setArticleFilters] = useState({ 
    cancerType: 'all', 
    treatmentType: 'all', 
    search: '' 
  })
  const [articlePagination, setArticlePagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [stripeSettings, setStripeSettings] = useState<{
    publishableKey: string | null
    secretKey: string | null
    rawSecretKey: string | null
    webhookSecret: string | null
    updatedAt?: string
    createdAt?: string
  } | null>(null)
  const [stripeForm, setStripeForm] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  })
  const [savingStripeSettings, setSavingStripeSettings] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchStats()
      fetchUsers()
      fetchRssFeeds()
      fetchNcbiQueries()
      fetchStripeSettings()
      fetchPlans()
    }
  }, [session, status])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })
    setIsLoading(false)
    if (result?.ok) {
      router.refresh()
    } else {
      alert('Invalid credentials')
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        // Convert Decimal to number for display
        const serializedPlans = data.plans.map((plan: any) => ({
          ...plan,
          monthlyPrice: typeof plan.monthlyPrice === 'object' && plan.monthlyPrice !== null && 'toNumber' in plan.monthlyPrice
            ? (plan.monthlyPrice as any).toNumber()
            : typeof plan.monthlyPrice === 'number'
            ? plan.monthlyPrice
            : parseFloat(String(plan.monthlyPrice)),
          yearlyPrice: typeof plan.yearlyPrice === 'object' && plan.yearlyPrice !== null && 'toNumber' in plan.yearlyPrice
            ? (plan.yearlyPrice as any).toNumber()
            : typeof plan.yearlyPrice === 'number'
            ? plan.yearlyPrice
            : parseFloat(String(plan.yearlyPrice)),
        }))
        setPlans(serializedPlans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      cancerType: user.cancerType || '',
      zipCode: user.zipCode || '',
      planId: user.planId || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          planId: editForm.planId || null,
        }),
      })
      if (res.ok) {
        setEditingUser(null)
        fetchUsers()
        alert('User updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const handlePlanChange = async (userId: string, newPlanId: string) => {
    if (!confirm('Are you sure you want to change this user\'s plan?')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: newPlanId || null,
        }),
      })
      if (res.ok) {
        fetchUsers()
        alert('Plan updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update plan')
      }
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Error updating plan')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchUsers()
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }

  const fetchRssFeeds = async () => {
    try {
      const res = await fetch('/api/admin/rss-feeds')
      if (res.ok) {
        const data = await res.json()
        setRssFeeds(data.feeds || [])
      }
    } catch (error) {
      console.error('Error fetching RSS feeds:', error)
    }
  }

  const handleAddRssFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rssFeedForm),
      })
      if (res.ok) {
        setRssFeedForm({ url: '', name: '', description: '', isActive: true })
        setShowAddRssFeed(false)
        fetchRssFeeds()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add RSS feed')
      }
    } catch (error) {
      console.error('Error adding RSS feed:', error)
      alert('Error adding RSS feed')
    }
  }

  const handleEditRssFeed = (feed: RssFeed) => {
    setEditingRssFeed(feed)
    setRssFeedForm({
      url: feed.url,
      name: feed.name || '',
      description: feed.description || '',
      isActive: feed.isActive,
    })
  }

  const handleSaveRssFeed = async () => {
    if (!editingRssFeed) return
    try {
      const res = await fetch(`/api/admin/rss-feeds/${editingRssFeed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rssFeedForm),
      })
      if (res.ok) {
        setEditingRssFeed(null)
        setRssFeedForm({ url: '', name: '', description: '', isActive: true })
        fetchRssFeeds()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update RSS feed')
      }
    } catch (error) {
      console.error('Error updating RSS feed:', error)
      alert('Error updating RSS feed')
    }
  }

  const handleDeleteRssFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to delete this RSS feed?')) return
    try {
      const res = await fetch(`/api/admin/rss-feeds/${feedId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchRssFeeds()
      } else {
        alert('Failed to delete RSS feed')
      }
    } catch (error) {
      console.error('Error deleting RSS feed:', error)
      alert('Error deleting RSS feed')
    }
  }

  const fetchNcbiQueries = async () => {
    try {
      const res = await fetch('/api/admin/ncbi-queries')
      if (res.ok) {
        const data = await res.json()
        setNcbiQueries(data.queries || [])
      }
    } catch (error) {
      console.error('Error fetching NCBI queries:', error)
    }
  }

  const handleAddNcbiQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/ncbi-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncbiQueryForm),
      })
      if (res.ok) {
        setNcbiQueryForm({ query: '', name: '', description: '', isActive: true })
        setShowAddNcbiQuery(false)
        fetchNcbiQueries()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add NCBI query')
      }
    } catch (error) {
      console.error('Error adding NCBI query:', error)
      alert('Error adding NCBI query')
    }
  }

  const handleEditNcbiQuery = (query: NcbiQuery) => {
    setEditingNcbiQuery(query)
    setNcbiQueryForm({
      query: query.query,
      name: query.name || '',
      description: query.description || '',
      isActive: query.isActive,
    })
  }

  const handleSaveNcbiQuery = async () => {
    if (!editingNcbiQuery) return
    try {
      const res = await fetch(`/api/admin/ncbi-queries/${editingNcbiQuery.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncbiQueryForm),
      })
      if (res.ok) {
        setEditingNcbiQuery(null)
        setNcbiQueryForm({ query: '', name: '', description: '', isActive: true })
        fetchNcbiQueries()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update NCBI query')
      }
    } catch (error) {
      console.error('Error updating NCBI query:', error)
      alert('Error updating NCBI query')
    }
  }

  const handleDeleteNcbiQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this NCBI query?')) return
    try {
      const res = await fetch(`/api/admin/ncbi-queries/${queryId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchNcbiQueries()
      } else {
        alert('Failed to delete NCBI query')
      }
    } catch (error) {
      console.error('Error deleting NCBI query:', error)
      alert('Error deleting NCBI query')
    }
  }

  const fetchArticles = async () => {
    setLoadingArticles(true)
    try {
      const params = new URLSearchParams()
      if (articleFilters.cancerType !== 'all') {
        params.append('cancerType', articleFilters.cancerType)
      }
      if (articleFilters.treatmentType !== 'all') {
        params.append('treatmentType', articleFilters.treatmentType)
      }
      if (articleFilters.search) {
        params.append('search', articleFilters.search)
      }
      params.append('page', articlePagination.page.toString())
      params.append('limit', articlePagination.limit.toString())

      const res = await fetch(`/api/admin/articles?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setArticles(data.papers || [])
        setArticlePagination((prev) => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
        }))
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoadingArticles(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchArticles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleFilters, articlePagination.page, status, session])

  const handleArticleFilterChange = (key: string, value: string) => {
    setArticleFilters({ ...articleFilters, [key]: value })
    setArticlePagination({ ...articlePagination, page: 1 }) // Reset to first page
  }

  const handleArticleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setArticlePagination({ ...articlePagination, page: 1 })
    fetchArticles()
  }

  const fetchStripeSettings = async () => {
    try {
      const res = await fetch('/api/admin/stripe-settings')
      if (res.ok) {
        const data = await res.json()
        setStripeSettings(data.settings)
        setStripeForm({
          publishableKey: data.settings.publishableKey || '',
          secretKey: data.settings.rawSecretKey || '', // Use raw secret key for editing
          webhookSecret: data.settings.webhookSecret || '',
        })
      }
    } catch (error) {
      console.error('Error fetching Stripe settings:', error)
    }
  }

  const handleSaveStripeSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStripeSettings(true)
    try {
      const res = await fetch('/api/admin/stripe-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishableKey: stripeForm.publishableKey || null,
          secretKey: stripeForm.secretKey || null,
          webhookSecret: stripeForm.webhookSecret || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setStripeSettings(data.settings)
        alert('Stripe settings saved successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save Stripe settings')
      }
    } catch (error) {
      console.error('Error saving Stripe settings:', error)
      alert('Error saving Stripe settings')
    } finally {
      setSavingStripeSettings(false)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/plans')} variant="outline">
              Manage Plans
            </Button>
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalCheckIns || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chat Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalChatSessions || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Users (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.activeUsersLast30Days || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalPapers || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Research Papers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FDA Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalFdaApprovals || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Drug Approvals</p>
            </CardContent>
          </Card>
        </div>

        {/* Research Papers by Cancer Type */}
        {stats && stats.cancerTypeStats && stats.cancerTypeStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Articles by Cancer Type</CardTitle>
                <CardDescription>
                  Distribution of research papers by cancer type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CancerTypeBarChart
                  data={stats.cancerTypeStats}
                  total={stats.totalPapers}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cancer Type Distribution</CardTitle>
                <CardDescription>
                  Percentage breakdown of articles by cancer type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CancerTypePieChart
                  data={stats.cancerTypeStats}
                  total={stats.totalPapers}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* FDA Approvals by Cancer Type */}
        {stats && stats.fdaCancerTypeStats && stats.fdaCancerTypeStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>FDA Approvals by Cancer Type</CardTitle>
                <CardDescription>
                  Distribution of FDA drug approvals by cancer type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CancerTypeBarChart
                  data={stats.fdaCancerTypeStats}
                  total={stats.totalFdaApprovals || 0}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>FDA Approvals Distribution</CardTitle>
                <CardDescription>
                  Percentage breakdown of FDA approvals by cancer type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CancerTypePieChart
                  data={stats.fdaCancerTypeStats}
                  total={stats.totalFdaApprovals || 0}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Cancer Type</th>
                    <th className="text-left p-2">Plan</th>
                    <th className="text-left p-2">Check-ins</th>
                    <th className="text-left p-2">Chat Sessions</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">{user.name || 'N/A'}</td>
                      <td className="p-2">{user.email || 'N/A'}</td>
                      <td className="p-2">{user.cancerType || 'N/A'}</td>
                      <td className="p-2">
                        <Select
                          value={user.planId || ''}
                          onValueChange={(value) => handlePlanChange(user.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="No Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Plan</SelectItem>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">{user._count.dailyCheckins}</td>
                      <td className="p-2">{user._count.aiChatSessions}</td>
                      <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Edit User</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cancer Type</Label>
                      <Input
                        value={editForm.cancerType}
                        onChange={(e) => setEditForm({ ...editForm, cancerType: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Zip Code</Label>
                      <Input
                        value={editForm.zipCode}
                        onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Subscription Plan</Label>
                      <Select
                        value={editForm.planId}
                        onValueChange={(value) => setEditForm({ ...editForm, planId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Plan</SelectItem>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit}>Save</Button>
                      <Button variant="outline" onClick={() => setEditingUser(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSS Feed Management */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>RSS Feed Management</CardTitle>
                <CardDescription>Manage RSS feeds used for news ingestion</CardDescription>
              </div>
              <Button onClick={() => setShowAddRssFeed(true)}>Add RSS Feed</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">URL</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rssFeeds.map((feed) => (
                    <tr key={feed.id} className="border-b">
                      <td className="p-2">{feed.name || 'N/A'}</td>
                      <td className="p-2">
                        <a
                          href={feed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {feed.url.length > 50 ? feed.url.substring(0, 50) + '...' : feed.url}
                        </a>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {feed.description || 'N/A'}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            feed.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {feed.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(feed.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRssFeed(feed)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRssFeed(feed.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rssFeeds.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No RSS feeds configured. Add one to get started.
                </div>
              )}
            </div>

            {/* Add RSS Feed Modal */}
            {showAddRssFeed && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Add RSS Feed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleAddRssFeed} className="space-y-4">
                      <div>
                        <Label>URL *</Label>
                        <Input
                          type="url"
                          value={rssFeedForm.url}
                          onChange={(e) =>
                            setRssFeedForm({ ...rssFeedForm, url: e.target.value })
                          }
                          placeholder="https://example.com/rss.xml"
                          required
                        />
                      </div>
                      <div>
                        <Label>Name (Optional)</Label>
                        <Input
                          value={rssFeedForm.name}
                          onChange={(e) =>
                            setRssFeedForm({ ...rssFeedForm, name: e.target.value })
                          }
                          placeholder="Friendly name for this feed"
                        />
                      </div>
                      <div>
                        <Label>Description (Optional)</Label>
                        <Input
                          value={rssFeedForm.description}
                          onChange={(e) =>
                            setRssFeedForm({ ...rssFeedForm, description: e.target.value })
                          }
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={rssFeedForm.isActive}
                          onChange={(e) =>
                            setRssFeedForm({ ...rssFeedForm, isActive: e.target.checked })
                          }
                          className="rounded"
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Add Feed</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddRssFeed(false)
                            setRssFeedForm({ url: '', name: '', description: '', isActive: true })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Edit RSS Feed Modal */}
            {editingRssFeed && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Edit RSS Feed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>URL *</Label>
                      <Input
                        type="url"
                        value={rssFeedForm.url}
                        onChange={(e) =>
                          setRssFeedForm({ ...rssFeedForm, url: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Name (Optional)</Label>
                      <Input
                        value={rssFeedForm.name}
                        onChange={(e) =>
                          setRssFeedForm({ ...rssFeedForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Input
                        value={rssFeedForm.description}
                        onChange={(e) =>
                          setRssFeedForm({ ...rssFeedForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={rssFeedForm.isActive}
                        onChange={(e) =>
                          setRssFeedForm({ ...rssFeedForm, isActive: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="editIsActive">Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveRssFeed}>Save</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingRssFeed(null)
                          setRssFeedForm({ url: '', name: '', description: '', isActive: true })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NCBI Query Management */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>NCBI (PubMed) Query Management</CardTitle>
                <CardDescription>Manage PubMed search queries used for paper ingestion</CardDescription>
              </div>
              <Button onClick={() => setShowAddNcbiQuery(true)}>Add NCBI Query</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Query</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ncbiQueries.map((query) => (
                    <tr key={query.id} className="border-b">
                      <td className="p-2">{query.name || 'N/A'}</td>
                      <td className="p-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {query.query.length > 60 ? query.query.substring(0, 60) + '...' : query.query}
                        </code>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {query.description || 'N/A'}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            query.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {query.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditNcbiQuery(query)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteNcbiQuery(query.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ncbiQueries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No NCBI queries configured. Add one to get started.
                </div>
              )}
            </div>

            {/* Add NCBI Query Modal */}
            {showAddNcbiQuery && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Add NCBI Query</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleAddNcbiQuery} className="space-y-4">
                      <div>
                        <Label>Query *</Label>
                        <textarea
                          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={ncbiQueryForm.query}
                          onChange={(e) =>
                            setNcbiQueryForm({ ...ncbiQueryForm, query: e.target.value })
                          }
                          placeholder="breast cancer AND hasabstract[text] AND 2024:2025[Publication Date]"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a PubMed search query string
                        </p>
                      </div>
                      <div>
                        <Label>Name (Optional)</Label>
                        <Input
                          value={ncbiQueryForm.name}
                          onChange={(e) =>
                            setNcbiQueryForm({ ...ncbiQueryForm, name: e.target.value })
                          }
                          placeholder="Friendly name for this query"
                        />
                      </div>
                      <div>
                        <Label>Description (Optional)</Label>
                        <Input
                          value={ncbiQueryForm.description}
                          onChange={(e) =>
                            setNcbiQueryForm({ ...ncbiQueryForm, description: e.target.value })
                          }
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="ncbiIsActive"
                          checked={ncbiQueryForm.isActive}
                          onChange={(e) =>
                            setNcbiQueryForm({ ...ncbiQueryForm, isActive: e.target.checked })
                          }
                          className="rounded"
                        />
                        <Label htmlFor="ncbiIsActive">Active</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Add Query</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddNcbiQuery(false)
                            setNcbiQueryForm({ query: '', name: '', description: '', isActive: true })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Edit NCBI Query Modal */}
            {editingNcbiQuery && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Edit NCBI Query</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Query *</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={ncbiQueryForm.query}
                        onChange={(e) =>
                          setNcbiQueryForm({ ...ncbiQueryForm, query: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a PubMed search query string
                      </p>
                    </div>
                    <div>
                      <Label>Name (Optional)</Label>
                      <Input
                        value={ncbiQueryForm.name}
                        onChange={(e) =>
                          setNcbiQueryForm({ ...ncbiQueryForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Input
                        value={ncbiQueryForm.description}
                        onChange={(e) =>
                          setNcbiQueryForm({ ...ncbiQueryForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editNcbiIsActive"
                        checked={ncbiQueryForm.isActive}
                        onChange={(e) =>
                          setNcbiQueryForm({ ...ncbiQueryForm, isActive: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="editNcbiIsActive">Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNcbiQuery}>Save</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingNcbiQuery(null)
                          setNcbiQueryForm({ query: '', name: '', description: '', isActive: true })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Article Management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Article Management</CardTitle>
            <CardDescription>
              View and manage all research papers from PubMed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 space-y-4">
              <form onSubmit={handleArticleSearch} className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Search</Label>
                  <Input
                    type="text"
                    placeholder="Search by title or abstract..."
                    value={articleFilters.search}
                    onChange={(e) =>
                      setArticleFilters({ ...articleFilters, search: e.target.value })
                    }
                  />
                </div>
                <div className="w-[180px]">
                  <Label>Cancer Type</Label>
                  <Select
                    value={articleFilters.cancerType}
                    onValueChange={(value) => handleArticleFilterChange('cancerType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="breast">Breast</SelectItem>
                      <SelectItem value="lung">Lung</SelectItem>
                      <SelectItem value="colorectal">Colorectal</SelectItem>
                      <SelectItem value="prostate">Prostate</SelectItem>
                      <SelectItem value="pancreatic">Pancreatic</SelectItem>
                      <SelectItem value="liver">Liver</SelectItem>
                      <SelectItem value="stomach">Stomach</SelectItem>
                      <SelectItem value="esophageal">Esophageal</SelectItem>
                      <SelectItem value="bladder">Bladder</SelectItem>
                      <SelectItem value="kidney">Kidney</SelectItem>
                      <SelectItem value="cervical">Cervical</SelectItem>
                      <SelectItem value="ovarian">Ovarian</SelectItem>
                      <SelectItem value="leukemia">Leukemia</SelectItem>
                      <SelectItem value="lymphoma">Lymphoma</SelectItem>
                      <SelectItem value="melanoma">Melanoma</SelectItem>
                      <SelectItem value="brain">Brain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[180px]">
                  <Label>Treatment Type</Label>
                  <Select
                    value={articleFilters.treatmentType}
                    onValueChange={(value) => handleArticleFilterChange('treatmentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="immunotherapy">Immunotherapy</SelectItem>
                      <SelectItem value="chemotherapy">Chemotherapy</SelectItem>
                      <SelectItem value="radiation">Radiation</SelectItem>
                      <SelectItem value="targeted-therapy">Targeted Therapy</SelectItem>
                      <SelectItem value="hormone-therapy">Hormone Therapy</SelectItem>
                      <SelectItem value="stem-cell-transplant">Stem Cell Transplant</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit">Search</Button>
                </div>
              </form>
            </div>

            {/* Articles Table */}
            {loadingArticles ? (
              <div className="text-center py-8">Loading articles...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Title</th>
                        <th className="text-left p-2">Authors</th>
                        <th className="text-left p-2">Journal</th>
                        <th className="text-left p-2">Publication Date</th>
                        <th className="text-left p-2">Cancer Types</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((article) => (
                        <tr key={article.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <button
                              onClick={() => setSelectedArticle(article)}
                              className="text-left text-blue-600 hover:underline font-medium"
                            >
                              {article.title.length > 80
                                ? article.title.substring(0, 80) + '...'
                                : article.title}
                            </button>
                          </td>
                          <td className="p-2 text-sm">
                            {article.authors.length > 0
                              ? article.authors.slice(0, 2).join(', ') +
                                (article.authors.length > 2 ? ' et al.' : '')
                              : 'N/A'}
                          </td>
                          <td className="p-2 text-sm">{article.journal || 'N/A'}</td>
                          <td className="p-2 text-sm">
                            {article.publicationDate
                              ? new Date(article.publicationDate).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {article.cancerTypes.length > 0
                                ? article.cancerTypes.slice(0, 2).map((type) => (
                                    <span
                                      key={type}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                    >
                                      {type}
                                    </span>
                                  ))
                                : 'N/A'}
                              {article.cancerTypes.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{article.cancerTypes.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedArticle(article)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {articles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No articles found
                  </div>
                )}

                {/* Pagination */}
                {articlePagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((articlePagination.page - 1) * articlePagination.limit) + 1} to{' '}
                      {Math.min(articlePagination.page * articlePagination.limit, articlePagination.total)} of{' '}
                      {articlePagination.total} articles
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setArticlePagination({ ...articlePagination, page: articlePagination.page - 1 })
                        }
                        disabled={articlePagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setArticlePagination({ ...articlePagination, page: articlePagination.page + 1 })
                        }
                        disabled={articlePagination.page >= articlePagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Article Detail Modal */}
            {selectedArticle && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{selectedArticle.title}</CardTitle>
                        <CardDescription>
                          {selectedArticle.journal && (
                            <span className="block mb-1">{selectedArticle.journal}</span>
                          )}
                          {selectedArticle.publicationDate && (
                            <span className="block">
                              Published: {new Date(selectedArticle.publicationDate).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedArticle(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Authors */}
                    {selectedArticle.authors.length > 0 && (
                      <div>
                        <Label className="font-semibold">Authors</Label>
                        <p className="text-sm">{selectedArticle.authors.join(', ')}</p>
                      </div>
                    )}

                    {/* Cancer Types */}
                    {selectedArticle.cancerTypes.length > 0 && (
                      <div>
                        <Label className="font-semibold">Cancer Types</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedArticle.cancerTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Treatment Types */}
                    {selectedArticle.treatmentTypes.length > 0 && (
                      <div>
                        <Label className="font-semibold">Treatment Types</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedArticle.treatmentTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {selectedArticle.keywords.length > 0 && (
                      <div>
                        <Label className="font-semibold">Keywords</Label>
                        <p className="text-sm">{selectedArticle.keywords.join(', ')}</p>
                      </div>
                    )}

                    {/* Abstract */}
                    {selectedArticle.abstract && (
                      <div>
                        <Label className="font-semibold">Abstract</Label>
                        <p className="text-sm whitespace-pre-wrap mt-1">{selectedArticle.abstract}</p>
                      </div>
                    )}

                    {/* Plain Summary */}
                    {selectedArticle.summaryPlain && (
                      <div>
                        <Label className="font-semibold">Plain Language Summary</Label>
                        <p className="text-sm whitespace-pre-wrap mt-1">{selectedArticle.summaryPlain}</p>
                      </div>
                    )}

                    {/* Clinical Summary */}
                    {selectedArticle.summaryClinical && (
                      <div>
                        <Label className="font-semibold">Clinical Summary</Label>
                        <p className="text-sm whitespace-pre-wrap mt-1">{selectedArticle.summaryClinical}</p>
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex gap-2 pt-4 border-t">
                      {selectedArticle.fullTextUrl && (
                        <Button asChild variant="default">
                          <a
                            href={selectedArticle.fullTextUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on PubMed
                          </a>
                        </Button>
                      )}
                      <Button asChild variant="outline">
                        <a
                          href={`https://www.ncbi.nlm.nih.gov/pubmed/${selectedArticle.pubmedId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Original Article
                        </a>
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground pt-4 border-t">
                      <p>PubMed ID: {selectedArticle.pubmedId}</p>
                      <p>
                        Ingested: {new Date(selectedArticle.ingestedAt).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stripe Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Stripe Settings</CardTitle>
            <CardDescription>
              Configure Stripe API keys for payment processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveStripeSettings} className="space-y-4">
              <div>
                <Label htmlFor="publishableKey">Publishable Key</Label>
                <Input
                  id="publishableKey"
                  type="text"
                  value={stripeForm.publishableKey}
                  onChange={(e) =>
                    setStripeForm({ ...stripeForm, publishableKey: e.target.value })
                  }
                  placeholder="pk_test_..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Stripe publishable key (starts with pk_)
                </p>
              </div>
              <div>
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={stripeForm.secretKey}
                  onChange={(e) =>
                    setStripeForm({ ...stripeForm, secretKey: e.target.value })
                  }
                  placeholder="sk_test_..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Stripe secret key (starts with sk_). Keep this secure.
                  {stripeSettings?.secretKey && stripeForm.secretKey === '' && (
                    <span className="block mt-1">
                      Current: {stripeSettings.secretKey} (masked)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={stripeForm.webhookSecret}
                  onChange={(e) =>
                    setStripeForm({ ...stripeForm, webhookSecret: e.target.value })
                  }
                  placeholder="whsec_..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Stripe webhook signing secret (starts with whsec_)
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingStripeSettings}>
                  {savingStripeSettings ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchStripeSettings()}
                >
                  Reset
                </Button>
              </div>
              {stripeSettings && (stripeSettings.updatedAt || stripeSettings.createdAt) && (
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p>
                    Last updated: {new Date(stripeSettings.updatedAt || stripeSettings.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  )
}

