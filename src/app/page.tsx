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
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
            <Marketplace products={products} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
