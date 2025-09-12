
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { NotificationProvider } from '@/contexts/notification-context';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.teemart.ng';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TeeMart | Nigeria\'s Trusted Marketplace for Used Goods',
    template: '%s | TeeMart Nigeria',
  },
  description: 'Buy and sell quality used goods in Nigeria with confidence. TeeMart is a secure online marketplace with an escrow service for cars, electronics, phones, furniture, and real estate. Find the best deals in Lagos, Abuja, and across Nigeria.',
  keywords: [
    'online marketplace nigeria',
    'buy and sell nigeria',
    'used cars nigeria',
    'second-hand phones lagos',
    'electronics market nigeria',
    'teemart',
    'nigerian classifieds',
    'escrow service nigeria',
    'safe online shopping nigeria',
    'real estate nigeria',
    'furniture for sale'
  ],
  authors: [{ name: 'TeeMart Inc.', url: siteUrl }],
  creator: 'TeeMart Inc.',
  publisher: 'TeeMart Inc.',
  openGraph: {
    title: 'TeeMart | Nigeria\'s Trusted Marketplace for Used Goods',
    description: 'The safest platform to buy and sell second-hand products in Nigeria, featuring escrow protection for all transactions.',
    url: siteUrl,
    siteName: 'TeeMart',
    images: [
      {
        url: '/og-image.png', // This image should be placed in the public folder
        width: 1200,
        height: 630,
        alt: 'TeeMart - Secure Online Marketplace in Nigeria',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeeMart | Nigeria\'s Trusted Marketplace for Used Goods',
    description: 'Discover the best deals on used cars, electronics, and more. TeeMart offers secure, escrow-protected transactions across Nigeria.',
    images: ['/twitter-image.png'], // This image should be placed in the public folder
    creator: '@TeeMartNG',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased bg-secondary/20">
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
