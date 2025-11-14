import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl mb-4">About Us</CardTitle>
              <CardDescription className="text-lg">
                Empowering cancer patients and caregivers with the latest research and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <div className="w-full flex justify-center my-6">
                <img 
                  src="https://res.cloudinary.com/dqemas8ht/image/upload/v1763155065/7fdf098b661440289d543bc44aa4a4c1_lplftv.png" 
                  alt="About Us" 
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-base leading-relaxed">
                  We are committed to helping cancer patients around the world stay on top of news, treatments, and the latest research being made around the world. We scan and analyze thousands of news articles, research papers, and clinical trials from all types of cancers so you are the first to know about the latest developments.
                </p>

                <p className="text-base leading-relaxed">
                  Our mission is to bridge the gap between cutting-edge cancer research and those who need it most. We understand that navigating through the vast amount of medical information can be overwhelming, especially when dealing with a cancer diagnosis. That's why we've built a comprehensive platform that brings together the most relevant and up-to-date information in one place.
                </p>

                <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Platform Features</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Personalized Dashboard</h3>
                    <p className="text-base leading-relaxed">
                      Get a personalized overview tailored to your specific cancer type, including key metrics, recent developments, and personalized insights for your cancer research journey.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Latest News & Research</h3>
                    <p className="text-base leading-relaxed">
                      Stay informed with the latest cancer research news from trusted sources worldwide. We continuously monitor and curate news articles, research papers, and FDA approvals relevant to your cancer type.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Clinical Trials Finder</h3>
                    <p className="text-base leading-relaxed">
                      Discover clinical trials near you that match your specific cancer type and location. Our intelligent matching system helps you find potential treatment opportunities that may be right for you.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered Research Assistant</h3>
                    <p className="text-base leading-relaxed">
                      Ask questions and get instant, contextual answers powered by advanced AI technology. Our AI research assistant helps you understand complex medical information and find relevant research papers.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">NCBI Database Access</h3>
                    <p className="text-base leading-relaxed">
                      Search and retrieve information directly from NCBI databases including PubMed, Protein, Nucleotide, Gene, SNP, Structure, and Taxonomy databases. Access the world's largest biomedical research database.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Personalized Alerts</h3>
                    <p className="text-base leading-relaxed">
                      Never miss important updates. Set up personalized alerts for new research articles, FDA approvals, clinical trials, and news related to your cancer type. Get notified via email when new information becomes available.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Daily Check-In & Symptom Tracking</h3>
                    <p className="text-base leading-relaxed">
                      Track your symptoms, treatment progress, and overall wellness over time. Monitor trends and share insights with your healthcare team to make more informed decisions about your care.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Cancer Type Overview</h3>
                    <p className="text-base leading-relaxed">
                      Get comprehensive information about your specific cancer type, including treatment options, recent research, statistics, and resources tailored to your diagnosis.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Emotional Support Resources</h3>
                    <p className="text-base leading-relaxed">
                      Access a curated directory of emotional support resources, support groups, counseling services, and practical help resources to support you and your loved ones throughout your journey.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Commitment</h2>

                <p className="text-base leading-relaxed">
                  We believe that access to the latest medical information should be available to everyone, regardless of their financial situation. That's why we offer a free plan with essential features, and we also provide free premium accounts for those facing financial hardship. Our goal is to ensure that no one has to navigate their cancer journey alone or without access to the information they need.
                </p>

                <p className="text-base leading-relaxed mt-4">
                  We continuously work to improve our platform, add new features, and ensure that the information we provide is accurate, up-to-date, and relevant. Your health and well-being are our top priorities, and we're here to support you every step of the way.
                </p>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    <strong>Important:</strong> The information provided on this platform is for educational purposes only and does not constitute medical advice. Always consult with your healthcare provider before making any treatment decisions.
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

