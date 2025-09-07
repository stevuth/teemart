
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { NotificationProvider } from '@/contexts/notification-context';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'TeeMart Marketplace',
  description: 'A Nigerian marketplace for high-quality used products.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/public/favicon.ico" type="image/x-icon" />
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
              <Toaster />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
        <Script id="service-worker-registration">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then(function(registration) {
                  console.log('Service Worker registered with scope:', registration.scope);
                }).catch(function(err) {
                  console.error('Service Worker registration failed:', err);
                });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

    
