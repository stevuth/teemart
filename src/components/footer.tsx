
import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer() {
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
    <footer className="bg-secondary text-card-foreground border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-4">
                <Link href="/" className="flex items-center gap-2 mb-4">
                <Image src="https://i.postimg.cc/QCbMpVpx/Chat-GPT-Image-Aug-16-2025-09-48-41-PM.png" alt="TeeMart Logo" width={32} height={32} />
                <span className="text-2xl font-bold">TeeMart</span>
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
            <div className="py-6 border-t border-secondary">
              <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TeeMart Inc. All rights reserved.</p>
            </div>
        </div>
    </footer>
  );
}
