
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export function Footer() {
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  const footerLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Help/FAQ', href: '/help' },
    { name: 'Safety Tips', href: '/safety-tips' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ];
  
  const handleBackToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
  }

  return (
    <footer className="bg-background text-foreground mt-12">
        <div 
            onClick={handleBackToTop}
            className="flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors"
        >
            <ArrowUp className="h-4 w-4"/>
            <span>Back to Top</span>
        </div>
        <div className="bg-card-foreground text-card py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 text-center text-sm">
                    {footerLinks.map((link) => (
                        <Link key={link.name} href={link.href} className="text-sm text-background/80 hover:text-background hover:underline uppercase transition-colors">
                            {link.name}
                        </Link>
                    ))}
                    <Link href="/sell" className="col-span-2 md:col-span-4 text-center text-sm text-background/80 hover:text-background hover:underline uppercase transition-colors">
                        Become a Seller
                    </Link>
                </div>
                 <Separator className="my-8 bg-border/20" />
                 <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TeeMart Inc. All rights reserved.</p>
            </div>
        </div>
    </footer>
  );
}
