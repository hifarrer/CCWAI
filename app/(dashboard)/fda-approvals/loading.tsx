import { Card, CardContent } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="h-9 w-64 bg-muted animate-pulse rounded mb-2" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-20 w-full bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

