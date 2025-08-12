
"use client";

import type { ReviewWithUser, Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { StarRatingDisplay } from "./star-rating-display";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from 'react';
import { Separator } from "./ui/separator";

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
        return listings.map(listing => ({
            ...listing,
            reviews: reviewsByProduct[listing.id] || []
        })).filter(item => item.reviews.length > 0);
    }, [listings, reviewsByProduct]);


    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    if (reviews.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-medium">No reviews yet</h3>
                <p className="mt-2 text-muted-foreground">Your listings don't have any reviews from buyers.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {productListWithReviews.map((product, pIndex) => (
                <Card key={product.id}>
                    <CardHeader>
                        <CardTitle>Reviews for: {product.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {product.reviews.map((review, rIndex) => (
                                <div key={review.id}>
                                    <div className="flex items-start gap-4">
                                        <Avatar>
                                            <AvatarImage src={review.user?.user_metadata.avatar_url} alt={review.user?.user_metadata.full_name} />
                                            <AvatarFallback>{getInitials(review.user?.user_metadata.full_name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{review.user?.user_metadata.full_name || 'Anonymous'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="my-1">
                                                <StarRatingDisplay rating={review.rating} />
                                            </div>
                                            <p className="text-muted-foreground">{review.comment}</p>
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
