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
import { Alerts } from '@/components/widgets/Alerts'
import { PremiumWidgetWrapper } from '@/components/widgets/PremiumWidgetWrapper'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Check if user has completed profile and get plan (skip for admin users)
  let isPremium = false
  if (session.user?.email && session.user?.role !== 'admin') {
    const { prisma } = await import('@/lib/db/client')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.profileCompleted) {
      redirect('/onboarding')
    }

    // Get plan name if planId exists
    const planId = (user as any)?.planId
    if (planId) {
      const plan = await (prisma as any).subscriptionPlan.findUnique({
        where: { id: planId },
        select: { name: true },
      })
      isPremium = plan?.name?.toLowerCase() === 'premium'
    }
  } else if (session.user?.role === 'admin') {
    // Admins always have premium access
    isPremium = true
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen">
        <Header />
        <main className="max-w-[1240px] mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Free widgets - always visible */}
            <CancerTypeOverview />
            <DailyCheckIn />
            <LatestNews />
            <ClinicalTrials />
            
            {/* Premium widgets - blurred for free users */}
            <PremiumWidgetWrapper title="AI Research" isPremium={isPremium}>
              <AIResearch />
            </PremiumWidgetWrapper>
            
            <PremiumWidgetWrapper title="Alerts" isPremium={isPremium}>
              <Alerts />
            </PremiumWidgetWrapper>
            
            <PremiumWidgetWrapper title="Articles By Cancer Type" isPremium={isPremium}>
              <ArticlesByCancerType />
            </PremiumWidgetWrapper>
            
            <PremiumWidgetWrapper title="Ask The AI" isPremium={isPremium}>
              <AskTheAI />
            </PremiumWidgetWrapper>
            
            <PremiumWidgetWrapper title="NCBI Query" isPremium={isPremium}>
              <NCBIQuery />
            </PremiumWidgetWrapper>
          </div>
        </main>
      </div>
      <Footer />
    </SessionProvider>
  )
}

