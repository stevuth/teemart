
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/back-button';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton className="-ml-4" />
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none space-y-4">
            <div>Last updated: {new Date().toLocaleDateString()}</div>

            <div>
              TeeMart ("us", "we", or "our") operates the TeeMart website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </div>

            <h2>Information Collection and Use</h2>
            <div>
              We collect several different types of information for various purposes to provide and improve our Service to you. This may include, but is not limited to, your email address, name, phone number, and usage data.
            </div>

            <h2>Use of Data</h2>
            <div>
              TeeMart uses the collected data for various purposes:
              <ul className="list-disc pl-6 mt-2">
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer care and support</li>
                <li>To provide analysis or valuable information so that we can improve the Service</li>
                <li>To monitor the usage of the Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </div>

            <h2>Security of Data</h2>
            <div>
              The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </div>

            <h2>Changes to This Privacy Policy</h2>
            <div>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </div>

            <h2>Contact Us</h2>
            <div>
              If you have any questions about this Privacy Policy, please contact us.
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
