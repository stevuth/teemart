
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/20">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Secure Checkout</h1>
            <p className="mt-2 text-lg text-muted-foreground">Complete your purchase with TeeMart Escrow Protection.</p>
          </div>
          <CheckoutForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
