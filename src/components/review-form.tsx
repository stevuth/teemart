
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { StarRatingInput } from "./star-rating-input";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1 star.").max(5),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters." }).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

type ReviewFormProps = {
  sellerId: string;
  onReviewSubmitted: () => void;
};

export function ReviewForm({ sellerId, onReviewSubmitted }: ReviewFormProps) {
  const { toast } = useToast();
  const { user, supabase } = useAuth();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
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
       toast({ title: "Error", description: "You cannot review yourself.", variant: "destructive" });
       return;
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        seller_id: sellerId,
        user_id: user.id,
        rating: data.rating,
        comment: data.comment,
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation (if you add one)
             toast({ title: "Review already submitted", description: "You have already left a review for this seller.", variant: "destructive" });
        } else {
            throw error;
        }
      } else {
        toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
        form.reset({ rating: 0, comment: "" });
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
        <CardDescription>Share your experience with this seller.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
