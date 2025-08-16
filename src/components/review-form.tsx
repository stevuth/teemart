
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Product } from "@/lib/types";
import { StarRatingInput } from "./star-rating-input";

const reviewFormSchema = z.object({
  productId: z.string({ required_error: "Please select a product to review." }),
  rating: z.number().min(1, "Rating must be at least 1 star.").max(5),
  comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

type ReviewFormProps = {
  listings: Product[];
  sellerId: string;
  onReviewSubmitted: () => void;
};

export function ReviewForm({ listings, sellerId, onReviewSubmitted }: ReviewFormProps) {
  const { toast } = useToast();
  const { user, supabase } = useAuth();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      productId: undefined,
      rating: 0,
      comment: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ReviewFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to leave a review.", variant: "destructive" });
      return;
    }
    
    if (user.id === sellerId) {
       toast({ title: "Error", description: "You cannot review your own products.", variant: "destructive" });
       return;
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: data.productId,
        user_id: user.id,
        rating: data.rating,
        comment: data.comment,
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
             toast({ title: "Review already submitted", description: "You have already left a review for this product.", variant: "destructive" });
        } else {
            throw error;
        }
      } else {
        toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
        form.reset({ rating: 0, comment: "", productId: undefined });
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error("Review submission error:", error);
      toast({ title: "Operation Failed", description: error.message || "There was an error submitting your review.", variant: "destructive" });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with one of this seller's products.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product to review" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {listings.map(listing => (
                        <SelectItem key={listing.id} value={listing.id}>
                          {listing.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <StarRatingInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell others about your experience..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
