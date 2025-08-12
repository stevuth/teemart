
"use client"

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProductPage() {
  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
            <p className="mt-4 text-lg text-muted-foreground">Sorry, the page you were looking for doesn't exist.</p>
            <Button asChild className="mt-6">
                <Link href="/">Go Back Home</Link>
            </Button>
        </main>
        <Footer />
    </div>
  )
}
