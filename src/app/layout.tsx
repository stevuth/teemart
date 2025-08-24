
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { NotificationProvider } from '@/contexts/notification-context';

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
        <link rel="icon" href="https://sdmntpritalynorth.oaiusercontent.com/files/00000000-cdc4-6246-b322-b1daba6ab02f/raw?se=2025-08-24T13%3A49%3A20Z&sp=r&sv=2024-08-04&sr=b&scid=29fd0666-e977-515e-8609-ef64501d3c68&skoid=f05d6a75-3c59-41ae-be2c-51a75f29841e&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-24T06%3A01%3A08Z&ske=2025-08-25T06%3A01%3A08Z&sks=b&skv=2024-08-04&sig=i6B0RoxK/EQLe30zC4k7X9VxtcUaDIgbPMzxjoh8uFc%3D" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
      </body>
    </html>
  );
}
