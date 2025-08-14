
"use client"

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductWithSeller } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ShoppingCart, MessageCircle, MapPin, Tag, Truck, ShieldCheck, Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';
import { recommendProducts, RecommendProductsInput } from '@/ai/flows/product-recommendations';
import { useCart } from '@/hooks/use-cart';

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id as string;
    const { toast } = useToast();
    const { addToCart } = useCart();
    
    const [product, setProduct] = useState<ProductWithSeller | null>(null);
    const [loading, setLoading] = useState(true);
    const [recommended, setRecommended] = useState<Product[]>([]);
    const [recommending, setRecommending] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            setLoading(true);

            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    seller:profiles!user_id(id, full_name, avatar_url, is_verified)
                `)
                .eq('id', productId)
                .single();

            if (error || !data) {
                console.error("Error fetching product:", error);
                setProduct(null);
            } else {
                const sellerData = data.seller as any;
                const transformedData = {
                    ...data,
                    image: data.image_url || [],
                    postedDate: data.created_at,
                    deliveryFee: data.delivery_fee,
                    price: data.price || 0,
                    category: data.category || '',
                    location: data.location || '',
                    city: data.city || '',
                    condition: data.condition || 'Used',
                    description: data.description || '',
                    seller: {
                        id: sellerData.id,
                        full_name: sellerData.full_name || 'TeeMart Seller',
                        avatar_url: sellerData.avatar_url,
                        is_verified: sellerData.is_verified || false,
                    }
                } as ProductWithSeller;
                setProduct(transformedData);
            }
            setLoading(false);
        };

        fetchProduct();
    }, [productId]);

    useEffect(() => {
        if(product) {
            const fetchRecommendations = async () => {
                setRecommending(true);
                try {
                    const input: RecommendProductsInput = {
                        productName: product.name,
                        productDescription: product.description,
                        productCategory: product.category,
                    };
                    const { recommendedProducts } = await recommendProducts(input);

                    // We need to fetch real product data based on the names.
                    // This is a simplified version, ideally you'd have a better matching system.
                    const { data: realProducts, error } = await supabase
                        .from('products')
                        .select('id, name, price, image_url, category, location, city, condition, description, created_at, delivery_fee, user_id, seller:profiles!user_id(id, full_name, avatar_url, is_verified)')
                        .in('name', recommendedProducts.map(p => p.name))
                        .limit(3);

                    if (error) throw error;
                    
                    const transformed = (realProducts as any[]).map(item => ({
                        ...item,
                        image: item.image_url || [],
                        postedDate: item.created_at,
                        deliveryFee: item.delivery_fee,
                        seller: item.seller,
                    })) as Product[];
                    setRecommended(transformed);

                } catch(e) {
                    console.error("Failed to get recommendations", e);
                } finally {
                    setRecommending(false);
                }
            }
            fetchRecommendations();
        }
    }, [product]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        <Skeleton className="w-full aspect-square rounded-xl" />
                        <div className="space-y-6">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-12 w-1/2" />
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return notFound();
    }
    
    const getInitials = (name?: string | null) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const images = Array.isArray(product.image) ? product.image : [product.image];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
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
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-0.5">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <Star className="w-4 h-4 text-gray-300" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">(125)</span>
                                        </div>
                                    </div>
                                </div>
                                 <Button asChild className="w-full mt-4">
                                    <Link href={`/profile/${product.seller.id}`}>
                                        <MessageCircle className="mr-2 h-4 w-4"/> View Profile & Chat
                                    </Link>
                                </Button>
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
                             <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-6">
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
