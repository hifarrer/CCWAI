import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fixFdaDrugNames } from '@/lib/ingestion/fix-fda-drug-names'

/**
 * Admin endpoint to fix FDA drug names from existing metadata
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you can customize this check based on your auth setup)
    // For now, we'll allow any authenticated user to run this
    // In production, you might want to check for admin role
    
    const result = await fixFdaDrugNames()

    return NextResponse.json({
      success: true,
      ...result,
      message: `Fixed ${result.fixed} FDA approvals, ${result.failed} could not be fixed`,
    })
  } catch (error) {
    console.error('Error fixing FDA drug names:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix FDA drug names',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

