'use client'

// Simplified grid layout - using CSS Grid for better mobile responsiveness
// react-grid-layout can be added back later if drag-and-drop is needed

interface DashboardGridProps {
  children: React.ReactNode[]
}

export function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child, index) => (
          <div key={`widget-${index + 1}`}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

