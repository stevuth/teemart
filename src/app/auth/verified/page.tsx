
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function EmailVerifiedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <CardTitle className="mt-4 text-2xl">Email Verified Successfully</CardTitle>
                <CardDescription>
                    Thank you for verifying your email. You can now explore all the features of TeeMart.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/">Continue to Homepage</Link>
                </Button>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
