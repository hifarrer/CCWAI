import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get research paper statistics
    const totalPapers = await prisma.researchPaper.count()

    // Get papers grouped by cancer type
    const allPapers = await prisma.researchPaper.findMany({
      select: {
        cancerTypes: true,
      },
    })

    // Count papers by cancer type (papers can have multiple cancer types)
    const cancerTypeCounts: Record<string, number> = {}
    allPapers.forEach((paper) => {
      if (paper.cancerTypes && paper.cancerTypes.length > 0) {
        paper.cancerTypes.forEach((cancerType) => {
          cancerTypeCounts[cancerType] = (cancerTypeCounts[cancerType] || 0) + 1
        })
      } else {
        // Papers with no cancer type
        cancerTypeCounts['other'] = (cancerTypeCounts['other'] || 0) + 1
      }
    })

    // Calculate total occurrences (may be > totalPapers since papers can have multiple types)
    const totalOccurrences = Object.values(cancerTypeCounts).reduce((sum, count) => sum + count, 0)

    // Convert to array format for easier frontend consumption
    // Percentage is based on total occurrences, not total papers (since papers can have multiple types)
    const cancerTypeStats = Object.entries(cancerTypeCounts)
      .map(([cancerType, count]) => ({
        cancerType,
        count,
        percentage: totalOccurrences > 0 ? Math.round((count / totalOccurrences) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending

    return NextResponse.json({
      cancerTypeStats,
      totalPapers,
    })
  } catch (error) {
    console.error('Error fetching article stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article statistics' },
      { status: 500 }
    )
  }
}

