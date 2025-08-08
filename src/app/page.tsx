import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Marketplace } from '@/components/marketplace';
import { products } from '@/lib/data';
import { Hero } from '@/components/hero';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <Hero />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Marketplace products={products} />
      </main>
      <Footer />
    </div>
  );
}
