import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Search, 
  Bell, 
  FileText, 
  FlaskConical, 
  MessageSquare, 
  Database,
  TrendingUp,
  Heart,
  ArrowRight,
  Play
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Personalized Dashboard',
      description: 'Get a comprehensive overview tailored to your specific cancer type with key metrics, recent developments, and personalized insights.',
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Latest News & Research',
      description: 'Stay informed with the latest cancer research news, articles, and FDA approvals from trusted sources worldwide.',
    },
    {
      icon: <FlaskConical className="h-8 w-8" />,
      title: 'Clinical Trials Finder',
      description: 'Discover clinical trials near you that match your cancer type and location. Find potential treatment opportunities.',
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'AI-Powered Assistant',
      description: 'Ask questions and get instant, contextual answers powered by advanced AI technology. Understand complex medical information.',
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: 'NCBI Database Access',
      description: 'Search and retrieve information from NCBI databases including PubMed, Protein, Gene, and more.',
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: 'Personalized Alerts',
      description: 'Never miss important updates. Get notified via email when new research, FDA approvals, or clinical trials become available.',
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Daily Check-In & Tracking',
      description: 'Track your symptoms, treatment progress, and overall wellness over time. Monitor trends and share insights with your healthcare team.',
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Comprehensive Cancer Information',
      description: 'Get detailed information about your specific cancer type, including treatment options, recent research, and support resources.',
    },
  ]

  const faqs = [
    {
      question: 'What is Cure Cancer With AI?',
      answer: 'Cure Cancer With AI is a comprehensive platform that helps cancer patients and caregivers stay informed about the latest news, treatments, and research developments. We scan and analyze thousands of news articles, research papers, and clinical trials from all types of cancers.',
    },
    {
      question: 'Is the platform free to use?',
      answer: 'Yes! We offer a free plan with essential features including personalized dashboard, daily check-in, clinical trials finder, and latest news. We also offer a premium plan with additional features, and free premium accounts are available for those facing financial hardship.',
    },
    {
      question: 'How do I get started?',
      answer: 'Simply sign up with your email or Google account. After completing a quick profile setup, you\'ll have access to your personalized dashboard with information tailored to your cancer type.',
    },
    {
      question: 'Is the information provided medical advice?',
      answer: 'No. The information provided on this platform is for educational purposes only and does not constitute medical advice. Always consult with your healthcare provider before making any treatment decisions.',
    },
    {
      question: 'How often is the information updated?',
      answer: 'We continuously monitor and update our database with the latest research papers, news articles, clinical trials, and FDA approvals. Our system scans thousands of sources daily to ensure you have access to the most current information.',
    },
    {
      question: 'Can I apply for a free premium account?',
      answer: 'Yes! If you\'re facing financial hardship, you can apply for a free premium account. Visit our plans page and click "Apply for a free premium account" to submit your application.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 py-20">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Stay Ahead of Cancer Research
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              We scan and analyze thousands of news articles, research papers, and clinical trials 
              from all types of cancers so you are the first to know about the latest developments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="/plans">
                  View Plans
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • Free plan available • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform brings together the most relevant and up-to-date cancer information 
              to help you make informed decisions about your care.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all bg-white"
              >
                <div className="text-purple-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demonstration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Watch a quick demonstration of how our platform helps you stay informed 
              about the latest cancer research and treatments.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              {/* Video Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center shadow-lg mb-4 hover:bg-white hover:scale-110 transition-transform cursor-pointer">
                      <Play className="h-12 w-12 text-purple-600 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium text-lg">
                    Video Demonstration
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Click to play
                  </p>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-20 h-20 bg-purple-200/30 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-pink-200/30 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-200/30 rounded-full blur-xl"></div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              Video placeholder - Replace with actual demonstration video
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Stay Informed?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of cancer patients and caregivers who trust us to keep them informed 
              about the latest developments in cancer research and treatment.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
              <Link href="/login">
                Start Your Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about Cure Cancer With AI
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-lg border border-gray-200 px-6 shadow-sm"
                >
                  <AccordionTrigger className="text-xl font-semibold text-gray-900 hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Still have questions?
              </p>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
