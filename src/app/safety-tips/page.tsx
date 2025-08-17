
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BackButton } from '@/components/back-button';
import { ShieldCheck, Users, Eye, MessageCircle, Banknote, MapPin } from 'lucide-react';

const safetyTips = {
  general: [
    {
      icon: ShieldCheck,
      title: "Use Our Escrow Service",
      description: "Always complete your transactions within TeeMart. Our escrow service protects your money until you confirm you're satisfied with the item. Never pay sellers directly or through other apps."
    },
    {
      icon: MapPin,
      title: "Meet in Safe, Public Places",
      description: "If you need to meet a seller in person to inspect or pick up an item, always choose a well-lit, public location. Avoid secluded areas."
    },
    {
      icon: Users,
      title: "Bring a Friend",
      description: "When meeting a buyer or seller, it's always a good idea to bring a friend or family member along with you for added safety."
    },
     {
      icon: Banknote,
      title: "Keep Personal Information Private",
      description: "Never share personal financial details like your bank account number, BVN, or credit card information. All payments are handled securely through our platform."
    },
  ],
  forBuyers: [
    {
      icon: Eye,
      title: "Inspect Before Confirming",
      description: "Thoroughly inspect the item upon receipt to ensure it matches the seller's description and photos. Only confirm delivery in the app once you are completely satisfied."
    },
    {
      icon: MessageCircle,
      title: "Communicate on TeeMart",
      description: "Keep all your communication with the seller on our platform. This creates a record of all conversations in case of a dispute."
    }
  ],
  forSellers: [
     {
      icon: Eye,
      title: "Be Honest and Accurate",
      description: "Provide clear, honest descriptions and high-quality photos of your items, including any flaws or defects. This builds trust and prevents disputes."
    },
    {
      icon: ShieldCheck,
      title: "Ship Only After Payment Confirmation",
      description: "Wait for TeeMart to confirm that the buyer has successfully paid into the escrow before shipping or handing over your item. This guarantees you will be paid upon successful delivery."
    }
  ]
}

export default function SafetyTipsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-8">
          <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight">Safety on TeeMart</h1>
              <p className="mt-4 text-lg text-muted-foreground">Your guide to buying and selling securely.</p>
          </div>

          <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold mb-6">General Safety Tips</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {safetyTips.general.map((tip, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><tip.icon className="h-6 w-6 text-primary" /></div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{tip.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">For Buyers</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {safetyTips.forBuyers.map((tip, index) => (
                     <Card key={index}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><tip.icon className="h-6 w-6 text-primary" /></div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{tip.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

               <div>
                <h2 className="text-2xl font-bold mb-6">For Sellers</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {safetyTips.forSellers.map((tip, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg"><tip.icon className="h-6 w-6 text-primary" /></div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{tip.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
