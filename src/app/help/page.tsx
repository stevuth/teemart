
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';

const faqs = [
  {
    question: "How do I buy an item on TeeMart?",
    answer: "To buy an item, browse our listings and click the 'Add to Cart' button on a product page. You can then view your cart and proceed to our secure checkout. All payments are held in escrow until you confirm you've received the item as described."
  },
  {
    question: "How does TeeMart protect buyers and sellers?",
    answer: "We use an escrow system for all transactions. When a buyer pays for an item, the money is held by TeeMart. We only release the funds to the seller after the buyer confirms they have received the product and it matches the description. This protects both parties from fraud."
  },
  {
    question: "How do I sell an item?",
    answer: "To sell an item, you first need to create an account. Once logged in, click the 'Sell' button in the header. You'll be guided through a simple form to upload pictures, write a description, and set your price. It's that easy!"
  },
  {
    question: "How do I become a verified seller?",
    answer: "You can apply for verification through your profile page. This involves a one-time payment and submitting your NIN and a selfie for identity confirmation. Verified sellers gain more trust from buyers, leading to more sales."
  },
  {
    question: "What are the fees for using TeeMart?",
    answer: "It's free to list items on TeeMart. We charge a small 5% escrow fee on successful transactions to cover the cost of securing the payment. This fee is split between the buyer (3%) and the seller (2%) and is clearly shown at checkout."
  },
   {
    question: "How do I contact a seller?",
    answer: "On any product page, you can find the seller's information. Click the 'View Profile & Chat' button to visit their profile, where you can start a direct message conversation with them to ask questions about the item."
  }
];


export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Help & Frequently Asked Questions</CardTitle>
            <CardDescription>Find answers to common questions about using TeeMart.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="prose prose-lg max-w-none">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-8 text-center text-muted-foreground">
                <p>Can't find the answer you're looking for?</p>
                <p>Contact us through our social media channels or check our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
