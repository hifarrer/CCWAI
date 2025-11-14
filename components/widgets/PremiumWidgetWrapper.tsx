'use client'

import { ReactNode } from 'react'
import { Diamond } from 'lucide-react'
import Link from 'next/link'

interface PremiumWidgetWrapperProps {
  children: ReactNode
  title: string
  isPremium: boolean
}

export function PremiumWidgetWrapper({ children, title, isPremium }: PremiumWidgetWrapperProps) {
  if (isPremium) {
    // User has premium, show widget normally
    return <>{children}</>
  }

  // Free user - show blurred widget with premium indicator
  return (
    <div className="relative widget overflow-hidden">
      {/* Premium Badge */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg">
        <Diamond className="h-3 w-3 fill-current" />
        <span>Premium</span>
      </div>

      {/* Widget Title - Visible */}
      <div className="relative z-30 mb-3 widget-header">
        <div className="widget-title">
          <span>{title}</span>
          <Diamond className="h-4 w-4 text-purple-500 fill-current" />
        </div>
      </div>

      {/* Blurred Content */}
      <div className="relative blur-sm pointer-events-none select-none opacity-60">
        <div className="widget-inner">
          {children}
        </div>
      </div>

      {/* Overlay with CTA */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-white/80 via-white/60 to-white/80 rounded-[26px] backdrop-blur-sm">
        <div className="text-center mb-4 px-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">Premium Feature</p>
          <p className="text-xs text-gray-600">Upgrade to unlock this widget</p>
        </div>
        <Link
          href="/plans"
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  )
}

