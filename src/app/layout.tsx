
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
        <link rel="icon" href="https://sdmntprnortheu.oaiusercontent.com/files/00000000-d348-61f4-8ab2-558b04d36155/raw?se=2025-08-24T13%3A34%3A28Z&sp=r&sv=2024-08-04&sr=b&scid=6177b60e-9da9-57d6-b8c4-af11a12f4c03&skoid=f05d6a75-3c59-41ae-be2c-51a75f29841e&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-23T19%3A33%3A49Z&ske=2025-08-24T19%3A33%3A49Z&sks=b&skv=2024-08-04&sig=c/rd3NTAg79JiW20JrMxdt1SwvftiE1cPC0t7Habw/o%3D" type="image/png" />
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
