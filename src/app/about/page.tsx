
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Users, Target, Eye, ShieldCheck, MapPin } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function AboutPage() {
  const teamMembers = [
    { name: "Tee Adeyemi", role: "Founder & CEO", image: "https://placehold.co/400x400.png", hint: "business person portrait" },
    { name: "Chika Okoro", role: "Head of Operations", image: "https://placehold.co/400x400.png", hint: "professional woman portrait" },
    { name: "Femi Balogun", role: "Lead Engineer", image: "https://placehold.co/400x400.png", hint: "software engineer portrait" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-64 md:h-80 bg-secondary flex items-center justify-center text-center p-4">
            <div className="absolute inset-0 bg-black/30"></div>
             <Image
                src="https://placehold.co/1920x800.png"
                alt="Diverse group of people smiling"
                fill
                className="object-cover opacity-20"
                data-ai-hint="diverse people collaboration"
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">About TeeMart</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                    Connecting communities by creating a trusted and convenient marketplace for everyone in Nigeria.
                </p>
            </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-20">
            <BackButton className="-ml-4" />
            {/* Our Story */}
            <section className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold">Our Story</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Founded in Imo State, TeeMart was born from a simple idea: what if buying and selling used goods online could be as safe and easy as shopping from a trusted friend? We saw the need for a platform where Nigerians could trade with confidence, free from the worries of scams and uncertainty.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        We built TeeMart from the ground up with an escrow system at its core, ensuring that every transaction is secure. Our journey is one of empowering individuals and small businesses, fostering a circular economy, and building a community based on trust.
                    </p>
                </div>
                 <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                    <Image
                        src="https://placehold.co/600x400.png"
                        alt="Marketplace illustration"
                        fill
                        className="object-cover"
                        data-ai-hint="community market"
                    />
                </div>
            </section>
            
            {/* Mission and Vision */}
            <section className="grid md:grid-cols-3 gap-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                       <div className="p-3 bg-primary/10 rounded-lg"><Target className="h-8 w-8 text-primary" /></div>
                        <CardTitle className="text-2xl">Our Mission</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">To create Nigeria's most trusted and user-friendly marketplace, where every transaction is secure, and every user feels valued and protected.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                         <div className="p-3 bg-primary/10 rounded-lg"><Eye className="h-8 w-8 text-primary" /></div>
                        <CardTitle className="text-2xl">Our Vision</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">To be the leading force in Nigeria's circular economy, fostering sustainable commerce and empowering millions to unlock the value in their pre-owned goods.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg"><MapPin className="h-8 w-8 text-primary" /></div>
                        <CardTitle className="text-2xl">Our Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">George Akume Road, Makurdi, Benue State.</p>
                    </CardContent>
                </Card>
            </section>
            
             {/* Core Values */}
            <section className="text-center">
                 <h2 className="text-3xl font-bold mb-8">Our Core Values</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Trust & Safety</h3>
                        <p className="text-muted-foreground">Security is not an afterthought; it's our foundation. Our escrow service and verification system are designed to protect every user.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Users className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Community First</h3>
                        <p className="text-muted-foreground">We are building more than a platform; we are building a community. We listen to, support, and grow with our users.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m16.2 7.8-1.4-1.4L6.6 14.6l1.4 1.4 8.2-8.2z"/></svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Simplicity</h3>
                        <p className="text-muted-foreground">From listing an item to making a purchase, we believe the process should be intuitive, straightforward, and hassle-free.</p>
                    </div>
                 </div>
            </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
