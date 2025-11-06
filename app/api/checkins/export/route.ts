import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import jsPDF from 'jspdf'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      userId: session.user.id,
    }

    if (startDate || endDate) {
      where.checkInDate = {}
      if (startDate) where.checkInDate.gte = new Date(startDate)
      if (endDate) where.checkInDate.lte = new Date(endDate)
    }

    const checkIns = await prisma.dailyCheckIn.findMany({
      where,
      orderBy: {
        checkInDate: 'desc',
      },
    })

    // Generate PDF
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Daily Check-In Report', 20, 20)
    doc.setFontSize(12)
    
    let y = 40
    checkIns.forEach((checkIn, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(12)
      doc.text(`Date: ${checkIn.checkInDate.toLocaleDateString()}`, 20, y)
      y += 10

      if (checkIn.notes) {
        doc.setFontSize(10)
        doc.text(`Notes: ${checkIn.notes}`, 20, y)
        y += 10
      }

      doc.setFontSize(10)
      doc.text('Symptoms:', 20, y)
      y += 7

      Object.entries(checkIn.symptoms as Record<string, number>).forEach(([name, value]) => {
        doc.text(`  ${name}: ${value}/10`, 20, y)
        y += 7
      })

      y += 5
    })

    const pdfBlob = doc.output('blob')
    
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="checkins-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error exporting check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to export check-ins' },
      { status: 500 }
    )
  }
}

