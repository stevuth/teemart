import Link from 'next/link';
import { Store, Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  const footerLinks = {
    'Categories': [
      { name: 'Cars', href: '#' },
      { name: 'Electronics', href: '#' },
      { name: 'Real Estate', href: '#' },
      { name: 'Furniture', href: '#' },
      { name: 'Phones', href: '#' },
    ],
    'About Us': [
      { name: 'Our Story', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
    ],
    'Support': [
      { name: 'Contact Us', href: '#' },
      { name: 'FAQ', href: '#' },
      { name: 'Safety Tips', href: '#' },
    ],
  };

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Store className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">TeeMart</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Nigeria's trusted marketplace for quality used goods.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold text-md mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
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

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TeeMart. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link key={social.name} href={social.href} className="text-muted-foreground hover:text-primary transition-colors">
                <social.icon className="h-5 w-5" />
                <span className="sr-only">{social.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
