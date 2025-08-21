
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ContactForm } from '@/components/contact-form';
import { BackButton } from '@/components/back-button';
import { Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton className="-ml-4" />
        <div className="max-w-4xl mx-auto mt-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
                <p className="mt-4 text-lg text-muted-foreground">We'd love to hear from you! Reach out with any questions or feedback.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <Card>
                        <CardHeader className="flex-row items-center gap-4">
                             <div className="p-3 bg-primary/10 rounded-lg"><Mail className="h-6 w-6 text-primary" /></div>
                            <CardTitle className="text-xl">Email Us</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">For general inquiries, support, or feedback, send us an email. We aim to respond within 24 hours.</p>
                            <a href="mailto:support@teemart.ng" className="text-primary font-semibold mt-2 block">support@teemart.ng</a>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg"><Phone className="h-6 w-6 text-primary" /></div>
                            <CardTitle className="text-xl">Call Us</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Our team is available from 9 AM to 5 PM, Monday to Friday.</p>
                            <a href="tel:+2348001234567" className="text-primary font-semibold mt-2 block">+234 (800) 123-4567</a>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <ContactForm />
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
