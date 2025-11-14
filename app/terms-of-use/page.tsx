import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Use</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            <div>
              <p className="text-muted-foreground">Last updated: January 2025</p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using curecancerwithai.com (the "Website"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily access the materials on curecancerwithai.com for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the Website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">3. Medical Disclaimer</h2>
              <p className="font-semibold text-red-600">
                IMPORTANT: The information provided on this website is for educational and informational purposes only and is not intended as medical advice, diagnosis, or treatment.
              </p>
              <p className="mt-4">
                The content on curecancerwithai.com should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website.
              </p>
              <p className="mt-4">
                If you think you may have a medical emergency, call your doctor or emergency services immediately. We do not recommend or endorse any specific tests, physicians, products, procedures, opinions, or other information that may be mentioned on the website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">4. User Accounts</h2>
              <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the security of your account and password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring that your account information remains accurate and up-to-date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">5. User Content</h2>
              <p>
                You retain ownership of any content you submit, post, or display on or through the Website. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purpose of operating and providing the Website.
              </p>
              <p className="mt-4">You agree not to post content that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Is illegal, harmful, or violates any laws</li>
                <li>Infringes on the rights of others</li>
                <li>Contains viruses or malicious code</li>
                <li>Is spam, fraudulent, or misleading</li>
                <li>Contains personal information of others without consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">6. Intellectual Property</h2>
              <p>
                The Website and its original content, features, and functionality are owned by curecancerwithai.com and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">7. Disclaimer of Warranties</h2>
              <p>
                The materials on curecancerwithai.com are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">8. Limitations of Liability</h2>
              <p>
                In no event shall curecancerwithai.com or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Website, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">9. Accuracy of Materials</h2>
              <p>
                The materials appearing on curecancerwithai.com could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">10. Links to Other Websites</h2>
              <p>
                Our Website may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that we shall not be responsible or liable for any damage or loss caused by or in connection with the use of any such content, goods, or services available on or through any such websites or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">11. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Website immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Website will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">12. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be interpreted and governed by the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">14. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Use, please contact us through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

