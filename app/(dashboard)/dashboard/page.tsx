import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ClinicalTrials } from '@/components/widgets/ClinicalTrials'
import { LatestNews } from '@/components/widgets/LatestNews'
import { AskTheAI } from '@/components/widgets/AskTheAI'
import { AlternativeMedicine } from '@/components/widgets/AlternativeMedicine'
import { TreatmentLibrary } from '@/components/widgets/TreatmentLibrary'
import { CancerTypeOverview } from '@/components/widgets/CancerTypeOverview'
import { EmotionalSupport } from '@/components/widgets/EmotionalSupport'
import { DailyCheckIn } from '@/components/widgets/DailyCheckIn'
import { NCBIQuery } from '@/components/widgets/NCBIQuery'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Your personalized cancer research companion
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NCBIQuery />
            <ClinicalTrials />
            <LatestNews />
            <AskTheAI />
            <AlternativeMedicine />
            <TreatmentLibrary />
            <CancerTypeOverview />
            <EmotionalSupport />
            <DailyCheckIn />
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}

