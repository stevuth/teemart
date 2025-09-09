
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ProductWithSeller } from '@/lib/types';
import { ShoppingCart, MapPin, Truck, ShieldCheck, Star, Store, MessageSquare } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { BackButton } from './back-button';
import { ProductCard } from './product-card';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { recommendProducts, RecommendProductsInput, RecommendProductsOutput } from '@/ai/flows/product-recommendations';
import { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

type ProductDetailClientProps = {
  product: ProductWithSeller;
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
    const { addToCart } = useCart();
    const { user, supabase } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [recommended, setRecommended] = useState<Product[]>([]);
    const [recommending, setRecommending] = useState(true);
    const [isChatting, setIsChatting] = useState(false);

    useEffect(() => {
        if(product && supabase) {
            const fetchRecommendations = async () => {
                setRecommending(true);
                try {
                    const input: RecommendProductsInput = {
                        productName: product.name,
                        productDescription: product.description,
                        productCategory: product.category,
                    };
                    const result: RecommendProductsOutput = await recommendProducts(input);
                    const recommendedProducts = result.recommendedProducts;

                    if (recommendedProducts.length === 0) {
                      setRecommended([]);
                      return;
                    }

                    const { data: realProducts, error } = await supabase
                        .from('products_with_sellers')
                        .select('*')
                        .in('name', recommendedProducts.map(p => p.name))
                        .neq('id', product.id)
                        .limit(3);

                    if (error) throw error;
                    
                    const transformed = (realProducts as any[]).map(item => ({
                        ...item,
                        image: item.image_url || [],
                        postedDate: item.created_at,
                        deliveryFee: item.delivery_fee,
                        price: item.price || 0,
                        category: item.category || '',
                        location: item.location || '',
                        city: item.city || '',
                        condition: item.condition || 'Used',
                        description: item.description || '',
                        user_id: item.user_id,
                        seller: {
                            id: item.user_id,
                            full_name: item.seller_name,
                            avatar_url: item.seller_avatar_url,
                            is_verified: item.seller_is_verified
                        }
                    })) as Product[];
                    setRecommended(transformed);

                } catch(e) {
                    console.error("Failed to get recommendations", e);
                    setRecommended([]);
                } finally {
                    setRecommending(false);
                }
            }
            fetchRecommendations();
        }
    }, [product, supabase]);
    
    const getInitials = (name?: string | null) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const startConversation = async (otherParticipantId: string) => {
        if (!user) {
            toast({ title: "Please log in", description: "You need to be logged in to start a chat.", variant: "destructive" });
            return;
        }
        if (!otherParticipantId) {
            toast({ title: "Error", description: "Recipient ID is missing.", variant: "destructive" });
            return;
        }

        setIsChatting(true);
        try {
            const { data, error } = await supabase.rpc('get_or_create_conversation', {
                p_participant_one_id: user.id,
                p_participant_two_id: otherParticipantId
            });

            if (error) throw error;
            
            router.push(`/chat/${data}`);

        } catch (error: any) {
            console.error("Detailed error object when starting conversation:", error);
            console.error("Stringified error for more details:", JSON.stringify(error, null, 2));
            toast({ title: "Error starting conversation", description: "Could not start a conversation. Please try again. Check console for details.", variant: "destructive" });
        } finally {
            setIsChatting(false);
        }
    };


    const images = Array.isArray(product.image) ? product.image : [product.image];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton className="-ml-4" />
                <div className="grid md:grid-cols-5 gap-8 lg:gap-12 mt-8">
                    {/* Image Carousel */}
                    <div className="md:col-span-3">
                         <Carousel className="w-full group rounded-xl overflow-hidden border">
                            <CarouselContent>
                            {images.map((imgSrc, index) => (
                                <CarouselItem key={index}>
                                <div className="relative block h-full aspect-square bg-secondary">
                                    <Image
                                    src={imgSrc || 'https://placehold.co/600x400.png'}
                                    alt={`${product.name} image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 60vw"
                                    />
                                </div>
                                </CarouselItem>
                            ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CarouselNext className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Carousel>
                    </div>

                    {/* Product Info */}
                    <div className="md:col-span-2">
                        <div className="sticky top-24">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Link href="#" className="hover:underline">{product.category}</Link>
                                <span>›</span>
                                <span>{product.condition}</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                            <p className="text-4xl font-bold text-primary mt-2">₦{product.price.toLocaleString()}</p>
                            
                            <Separator className="my-6" />

                            <p className="text-muted-foreground leading-relaxed">
                                {product.description}
                            </p>

                             <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{product.city}, {product.location}</span>
                                </div>
                                {product.deliveryFee && (
                                     <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-primary" />
                                        <span>Delivery fee: ₦{product.deliveryFee.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                             <Separator className="my-6" />
                            
                            {/* Seller Info */}
                            <div className="bg-secondary/30 p-4 rounded-lg">
                                <p className="font-semibold mb-3">Seller Information</p>
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-14 w-14">
                                        <AvatarImage src={product.seller.avatar_url || ''} />
                                        <AvatarFallback>{getInitials(product.seller.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg">{product.seller.full_name}</p>
                                            {product.seller.is_verified && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                                        </div>
                                    </div>
                                </div>
                                 <div className="grid grid-cols-2 gap-2 mt-4">
                                     <Button asChild className="w-full">
                                        <Link href={`/profile/${product.seller.id}`}>
                                            <Store className="mr-2 h-4 w-4"/> Visit Store
                                        </Link>
                                    </Button>
                                    <Button onClick={() => startConversation(product.seller.id)} disabled={isChatting} className="w-full">
                                        {isChatting ? <Loader variant="dots" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                        Chat Now
                                    </Button>
                                 </div>
                            </div>


                            <Button size="lg" className="w-full mt-6" onClick={() => addToCart(product)}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                            </Button>

                        </div>
                    </div>
                </div>
                 {/* Recommended Products */}
                <div className="mt-16 sm:mt-24">
                    <Separator />
                    <div className="py-12">
                        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">You Might Also Like</h2>
                        {recommending ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex flex-col space-y-3">
                                    <Skeleton className="h-[125px] w-full rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                    </div>
                                ))}
                            </div>
                        ) : recommended.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommended.map(recProduct => (
                                    <ProductCard key={recProduct.id} product={recProduct} />
                                ))}
                            </div>
                        ) : (
                           <p className="text-center text-muted-foreground">No recommendations available right now.</p>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

    
