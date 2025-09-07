
"use client";

import { useState } from 'react';
import type { ReviewWithUser } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { StarRatingDisplay } from "./star-rating-display";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "./ui/separator";
import { MessageSquare, ChevronDown } from "lucide-react";
import { Button } from './ui/button';

type ReviewListProps = {
    reviews: ReviewWithUser[];
}

const INITIAL_REVIEWS_COUNT = 3;

export function ReviewList({ reviews }: ReviewListProps) {
    const [showAll, setShowAll] = useState(false);

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    if (reviews.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">No reviews yet</h3>
                <p className="mt-2 text-muted-foreground">This seller hasn't received any reviews.</p>
            </div>
        )
    }

    const displayedReviews = showAll ? reviews : reviews.slice(0, INITIAL_REVIEWS_COUNT);

    return (
        <div className="space-y-8">
            {displayedReviews.map((review, rIndex) => (
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
                    {rIndex < displayedReviews.length - 1 && <Separator className="mt-8" />}
                </div>
            ))}
            
            {!showAll && reviews.length > INITIAL_REVIEWS_COUNT && (
                <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => setShowAll(true)}>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Read All {reviews.length} Reviews
                    </Button>
                </div>
            )}
        </div>
    )
}
