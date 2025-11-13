import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ClinicalTrials } from '@/components/widgets/ClinicalTrials'
import { LatestNews } from '@/components/widgets/LatestNews'
import { AskTheAI } from '@/components/widgets/AskTheAI'
import { CancerTypeOverview } from '@/components/widgets/CancerTypeOverview'
import { ArticlesByCancerType } from '@/components/widgets/ArticlesByCancerType'
import { EmotionalSupport } from '@/components/widgets/EmotionalSupport'
import { DailyCheckIn } from '@/components/widgets/DailyCheckIn'
import { NCBIQuery } from '@/components/widgets/NCBIQuery'
import { AIResearch } from '@/components/widgets/AIResearch'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Check if user has completed profile (skip for admin users)
  if (session.user?.email && session.user?.role !== 'admin') {
    const { prisma } = await import('@/lib/db/client')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { profileCompleted: true },
    })

    if (!user?.profileCompleted) {
      redirect('/onboarding')
    }
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen">
        <Header />
        <main className="max-w-[1240px] mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CancerTypeOverview />
            <DailyCheckIn />
            <AIResearch />
            <ArticlesByCancerType />
            <LatestNews />
            <AskTheAI />
            <NCBIQuery />
            <ClinicalTrials />
            
            
          </div>
        </main>
      </div>
      <Footer />
    </SessionProvider>
  )
}

