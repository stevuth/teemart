
"use client";

import type { ReviewWithUser, Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { StarRatingDisplay } from "./star-rating-display";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from 'react';
import { Separator } from "./ui/separator";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type ReviewListProps = {
    reviews: ReviewWithUser[];
    listings: Product[];
}

export function ReviewList({ reviews, listings }: ReviewListProps) {

    const reviewsByProduct = useMemo(() => {
        const grouped: { [key: string]: ReviewWithUser[] } = {};
        for (const review of reviews) {
            if (!grouped[review.product_id]) {
                grouped[review.product_id] = [];
            }
            grouped[review.product_id].push(review);
        }
        return grouped;
    }, [reviews]);
    
    const productListWithReviews = useMemo(() => {
        return listings
            .map(listing => ({
                ...listing,
                reviews: reviewsByProduct[listing.id] || []
            }))
            .filter(item => item.reviews.length > 0)
            .sort((a, b) => new Date(b.reviews[0].created_at).getTime() - new Date(a.reviews[0].created_at).getTime());
    }, [listings, reviewsByProduct]);


    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    if (reviews.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">No reviews yet</h3>
                <p className="mt-2 text-muted-foreground">This seller hasn't received any reviews on their products.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {productListWithReviews.map((product) => (
                <Card key={product.id}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                <Image 
                                    src={(Array.isArray(product.image) ? product.image[0] : product.image) || 'https://placehold.co/400x400.png'} 
                                    alt={product.name} 
                                    fill 
                                    sizes="64px"
                                    className="object-cover" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Reviews for</p>
                                <CardTitle className="text-xl font-semibold">
                                    <Link href={`/product/${product.id}`} className="hover:underline">
                                        {product.name}
                                    </Link>
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {product.reviews.map((review, rIndex) => (
                                <div key={review.id}>
                                    <div className="flex items-start gap-4">
                                        <Avatar>
                                            <AvatarImage src={review.user?.avatar_url || undefined} alt={review.user?.full_name || ''} />
                                            <AvatarFallback>{getInitials(review.user?.full_name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{review.user?.full_name || 'Anonymous'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="my-1">
                                                <StarRatingDisplay rating={review.rating} />
                                            </div>
                                            {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                                        </div>
                                    </div>
                                    {rIndex < product.reviews.length - 1 && <Separator className="mt-6" />}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

    