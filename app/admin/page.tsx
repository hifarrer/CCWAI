'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CancerTypeBarChart, CancerTypePieChart } from '@/components/admin/CancerTypeChart'

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
}

interface User {
  id: string
  name: string | null
  email: string | null
  cancerType: string | null
  zipCode: string | null
  createdAt: string
  _count: {
    dailyCheckins: number
    aiChatSessions: number
  }
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

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', cancerType: '', zipCode: '' })
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([])
  const [editingRssFeed, setEditingRssFeed] = useState<RssFeed | null>(null)
  const [rssFeedForm, setRssFeedForm] = useState({ url: '', name: '', description: '', isActive: true })
  const [showAddRssFeed, setShowAddRssFeed] = useState(false)
  const [ncbiQueries, setNcbiQueries] = useState<NcbiQuery[]>([])
  const [editingNcbiQuery, setEditingNcbiQuery] = useState<NcbiQuery | null>(null)
  const [ncbiQueryForm, setNcbiQueryForm] = useState({ query: '', name: '', description: '', isActive: true })
  const [showAddNcbiQuery, setShowAddNcbiQuery] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchStats()
      fetchUsers()
      fetchRssFeeds()
      fetchNcbiQueries()
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

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      cancerType: user.cancerType || '',
      zipCode: user.zipCode || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditingUser(null)
        fetchUsers()
      } else {
        alert('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
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

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
      </div>
    </div>
  )
}

