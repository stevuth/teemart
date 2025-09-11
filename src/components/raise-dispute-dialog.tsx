
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import type { Transaction } from "@/lib/types";
import { raiseDisputeAction } from '@/app/actions/dispute';

const formSchema = z.object({
    message: z.string().min(20, "Please provide a detailed description of the issue (at least 20 characters)."),
});

type DisputeFormValues = z.infer<typeof formSchema>;

type RaiseDisputeDialogProps = {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDisputeRaised: () => void;
}

export function RaiseDisputeDialog({ transaction, isOpen, onClose, onDisputeRaised }: RaiseDisputeDialogProps) {
  const { toast } = useToast();
  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const { isSubmitting } = form.formState;

  // Effect to reset the form when the dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({ message: "" });
    }
  }, [isOpen, form]);


  const handleSubmit = async (data: DisputeFormValues) => {
    if (!transaction) return;

    const result = await raiseDisputeAction(transaction.id, data.message);

    if (result.success) {
      toast({
        title: "Dispute Raised Successfully",
        description: "An admin will review your case and get in touch with you and the seller shortly.",
      });
      onDisputeRaised();
    } else {
      toast({
        title: "Failed to Raise Dispute",
        description: result.error || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a Dispute</DialogTitle>
          <DialogDescription>
            Describe the issue with your order for "{transaction?.product_details?.name}". This will pause the payment release and notify an admin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Dispute</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="e.g., The item is not as described, it arrived damaged, or it was never delivered."
                                    rows={5}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting}>
                            Cancel
                        </Button>
                    </DialogClose>
                     <Button type="submit" variant="secondary" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Dispute
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
