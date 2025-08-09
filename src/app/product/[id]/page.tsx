
import { products } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductDetails } from '@/components/product-details';
import { RecommendedProducts } from '@/components/recommended-products';

type ProductPageProps = {
  params: { id: string };
};

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <h1 className="text-4xl font-bold">404 - Product Not Found</h1>
                <p className="mt-4 text-lg text-muted-foreground">Sorry, we couldn't find the product you were looking for.</p>
            </main>
            <Footer />
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetails product={product} />
        <RecommendedProducts product={product} />
      </main>
      <Footer />
    </div>
  );
}
