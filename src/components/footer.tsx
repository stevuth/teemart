
import Link from 'next/link';
import { Store, Twitter, Facebook, Instagram, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  const footerLinks = [
      {
        title: 'Buy & Sell',
        links: [
            { name: 'All Categories', href: '#' },
            { name: 'Cars', href: '#' },
            { name: 'Electronics', href: '#' },
            { name: 'Property', href: '#' },
            { name: 'Mobile Phones', href: '#' },
        ],
      },
      {
        title: 'About TeeMart',
        links: [
            { name: 'About Us', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Press', href: '#' },
            { name: 'Contact Us', href: '#' },
        ],
      },
      {
        title: 'Support',
        links: [
            { name: 'Help/FAQ', href: '#' },
            { name: 'Safety Tips', href: '#' },
            { name: 'Terms of Service', href: '#' },
            { name: 'Privacy Policy', href: '#' },
        ],
      },
  ];

  return (
    <footer className="bg-gradient-to-t from-secondary via-background to-background border-t text-card-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-4">
                <Link href="/" className="flex items-center gap-2 mb-4">
                <Store className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">TeeMart</span>
                </Link>
                <p className="text-muted-foreground text-base max-w-sm">
                Nigeria's most trusted marketplace for buying and selling high-quality used goods safely and easily.
                </p>
                <div className="flex items-center gap-3 mt-6">
                    {socialLinks.map((social) => (
                    <Link
                        key={social.name}
                        href={social.href}
                        className="h-9 w-9 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                        <social.icon className="h-4 w-4" />
                        <span className="sr-only">{social.name}</span>
                    </Link>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
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
            
            <div className="lg:col-span-3">
                <h3 className="font-semibold text-md mb-4">Stay in the loop</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    Join our newsletter to get the latest deals and updates.
                </p>
                <form className="flex items-center gap-2">
                    <Input type="email" placeholder="Enter your email" className="flex-1" />
                    <Button type="submit" size="icon" aria-label="Subscribe">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            </div>
            <div className="py-6 border-t">
              <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TeeMart Inc. All rights reserved.</p>
            </div>
        </div>
    </footer>
  );
}
