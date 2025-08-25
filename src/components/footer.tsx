
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Only show the footer on the homepage
  if (pathname !== '/') {
    return null;
  }
  
  const footerLinks = [
      {
        title: 'Buy & Sell',
        links: [
            { name: 'All Categories', href: '/' },
            { name: 'Cars', href: '/' },
            { name: 'Electronics', href: '/' },
            { name: 'Property', href: '/' },
            { name: 'Mobile Phones', href: '/' },
        ],
      },
      {
        title: 'About TeeMart',
        links: [
            { name: 'About Us', href: '/about' },
            { name: 'Contact Us', href: '/contact' },
        ],
      },
      {
        title: 'Support',
        links: [
            { name: 'Help/FAQ', href: '/help' },
            { name: 'Safety Tips', href: '/safety-tips' },
            { name: 'Terms of Service', href: '/terms' },
            { name: 'Privacy Policy', href: '/privacy' },
        ],
      },
  ];

  return (
    <footer className="bg-background text-card-foreground border-t border-x-4 border-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-4">
            <Image src="https://sdmntpritalynorth.oaiusercontent.com/files/00000000-cdc4-6246-b322-b1daba6ab02f/raw?se=2025-08-24T13%3A49%3A20Z&sp=r&sv=2024-08-04&sr=b&scid=29fd0666-e977-515e-8609-ef64501d3c68&skoid=f05d6a75-3c59-41ae-be2c-51a75f29841e&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-24T06%3A01%3A08Z&ske=2025-08-25T06%3A01%3A08Z&sks=b&skv=2024-08-04&sig=i6B0RoxK/EQLe30zC4k7X9VxtcUaDIgbPMzxjoh8uFc%3D" alt="TeeMart Logo" width={56} height={56} />
            </Link>
            <p className="text-muted-foreground text-base max-w-sm">
            Nigeria's most trusted marketplace for buying and selling high-quality used goods safely and easily.
            </p>
        </div>

        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerLinks.map((section) => (
            <div key={section.title}>
                <h3 className="font-semibold text-md mb-4">{section.title}</h3>
                <ul className="space-y-3">
                {section.links.map((link) => (
                    <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.name}
                    </Link>
                    </li>
                ))}
                </ul>
            </div>
            ))}
        </div>
        
        </div>
        <div className="py-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TeeMart Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
