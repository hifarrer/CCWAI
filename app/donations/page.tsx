'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SupportPayment } from '@/components/widgets/SupportPayment'
import { CheckCircle, XCircle } from 'lucide-react'

export default function DonationsPage() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCanceled, setShowCanceled] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    if (searchParams.get('canceled') === 'true') {
      setShowCanceled(true)
      // Scroll to top to show canceled message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])
  const nonprofits = [
    {
      name: 'American Cancer Society (ACS)',
      url: 'https://www.cancer.org/',
      description: 'The American Cancer Society is a nationwide, community-based voluntary health organization dedicated to eliminating cancer as a major health problem.',
    },
    {
      name: 'Stand Up To Cancer (SU2C)',
      url: 'https://standuptocancer.org/',
      description: 'Stand Up To Cancer funds collaborative, multidisciplinary, and multi-institutional cancer research teams.',
    },
    {
      name: 'Breast Cancer Research Foundation (BCRF)',
      url: 'https://www.bcrf.org/',
      description: 'The Breast Cancer Research Foundation is committed to achieving prevention and a cure for breast cancer.',
    },
    {
      name: 'American Association for Cancer Research (AACR)',
      url: 'https://www.aacr.org/',
      description: 'The AACR is the first and largest cancer research organization dedicated to accelerating the conquest of cancer.',
    },
    {
      name: 'National Foundation for Cancer Research (NFCR)',
      url: 'https://www.nfcr.org/',
      description: 'NFCR supports cancer research and public education relating to the prevention, early diagnosis, better treatments, and ultimately, a cure for cancer.',
    },
    {
      name: 'CancerCare',
      url: 'https://www.cancercare.org/',
      description: 'CancerCare provides free, professional support services for anyone affected by cancer.',
    },
    {
      name: 'National Breast Cancer Foundation (NBCF)',
      url: 'https://www.nationalbreastcancer.org/',
      description: 'The National Breast Cancer Foundation provides help and inspires hope to those affected by breast cancer through early detection, education, and support services.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl mb-4">Support Our Project</CardTitle>
              <CardDescription className="text-lg">
                Help us maintain our AI-powered research platform and support cancer research organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 text-muted-foreground">
              {showSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Thank you for your support!</p>
                    <p className="text-sm">Your contribution helps us maintain our AI-powered research platform.</p>
                  </div>
                </div>
              )}

              {showCanceled && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-center gap-3">
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Payment Canceled</p>
                    <p className="text-sm">Your payment was canceled. You can try again anytime.</p>
                  </div>
                </div>
              )}

              <div className="prose prose-lg max-w-none">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Support Our Project</h2>
                  <p className="text-base leading-relaxed mb-4">
                    We accept contributions to help with the high server costs required to maintain our AI RAG (Retrieval-Augmented Generation) system. Our platform continuously scans and analyzes thousands of research papers and news articles in search of possible cures and breakthrough treatments for cancer.
                  </p>
                  <p className="text-base leading-relaxed mb-6">
                    Your generous contributions help us keep this critical service running, ensuring that cancer patients and their families have access to the latest research and information when they need it most. Every contribution, no matter the size, makes a difference in our ability to process and deliver life-saving information.
                  </p>
                  
                  <SupportPayment />
                </div>

                <h2 className="text-2xl font-semibold text-foreground mt-8 mb-6">Support Cancer Research Organizations</h2>
                <p className="text-base leading-relaxed mb-6">
                  In addition to supporting our project, we encourage you to consider contributing directly to these reputable cancer research non-profit organizations. These organizations are at the forefront of cancer research and provide critical support services to patients and families:
                </p>

                <div className="space-y-4">
                  {nonprofits.map((nonprofit, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {nonprofit.name}
                        </h3>
                        <p className="text-base leading-relaxed mb-4 text-muted-foreground">
                          {nonprofit.description}
                        </p>
                        <Button asChild variant="outline" className="mt-2">
                          <a 
                            href={nonprofit.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                          >
                            Visit {nonprofit.name.split('(')[0].trim()}
                            <svg 
                              className="ml-2 w-4 h-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                              />
                            </svg>
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    <strong>Note:</strong> We are not affiliated with the organizations listed above. We provide these links as a resource for those who wish to support cancer research directly. Please verify all information and donation processes directly with each organization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

