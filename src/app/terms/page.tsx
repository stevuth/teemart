
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using TeeMart (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>

            <h2>2. User Conduct</h2>
            <p>
              You agree not to use the Service to post or otherwise transmit any content that is unlawful, fraudulent, threatening, abusive, libelous, defamatory, obscene or otherwise objectionable. You are responsible for all content that you upload, post, email or otherwise transmit via the Service.
            </p>
            
            <h2>3. Listings</h2>
            <p>
              Sellers are responsible for the accuracy of their listings. Prohibited items may not be listed. TeeMart reserves the right to remove any listing for any reason. Buyers are responsible for reading the full item listing before making a purchase.
            </p>

            <h2>4. Limitation of Liability</h2>
            <p>
              TeeMart acts as a marketplace and is not directly involved in the transaction between buyers and sellers. We do not guarantee the quality, safety, or legality of items advertised, the truth or accuracy of listings, the ability of sellers to sell items, or the ability of buyers to pay for items.
            </p>

            <h2>5. Changes to the Agreement</h2>
            <p>
              We reserve the right to modify these terms from time to time at our sole discretion. Therefore, you should review these page periodically. Your continued use of the Website or our service after any such change constitutes your acceptance of the new Terms.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
