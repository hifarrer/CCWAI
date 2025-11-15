'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Bell } from 'lucide-react'
import { AlertsModal } from './AlertsModal'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread count
  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount()
      // Poll for new alerts every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/user/alerts/notifications')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleAlertsClick = () => {
    setAlertsOpen(true)
    // Refresh count when opening
    fetchUnreadCount()
  }

  return (
    <>
      <header className="max-w-[1240px] mx-auto px-4 pt-5 pb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Link href={session?.user ? "/dashboard" : "/login"}>
            <Image
              src="https://res.cloudinary.com/dqemas8ht/image/upload/v1762823833/CCWAI_1_stoio5.png"
              alt="Cure Cancer with AI"
              width={200}
              height={60}
              className="h-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            About
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/plans"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Plans
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Contact
          </Link>
          <Button asChild variant="default" size="sm" className="bg-pink-600 hover:bg-pink-700">
            <Link href="/donations">
              Support our project
            </Link>
          </Button>
          {!session?.user && (
            <Button asChild variant="default" size="sm">
              <Link href="/login">
                Login
              </Link>
            </Button>
          )}
          {session?.user && (
            <>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0"
                onClick={handleAlertsClick}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden p-0">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>
      {session?.user && (
        <AlertsModal
          open={alertsOpen}
          onOpenChange={(open) => {
            setAlertsOpen(open)
            if (!open) {
              // Refresh count when closing
              fetchUnreadCount()
            }
          }}
          onAlertsUpdated={fetchUnreadCount}
        />
      )}
    </>
  )
}

