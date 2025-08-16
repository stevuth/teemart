
"use client"

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import type { Product } from "@/lib/types";
import { Loader2 } from 'lucide-react';

type DeleteProductDialogProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteProductDialog({ product, isOpen, onClose, onDeleted }: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { supabase } = useAuth();

  const handleDelete = async () => {
    if (!product) return;
    setLoading(true);

    try {
      // 1. Delete images from storage
      const imageUrls = product.image;
      if (imageUrls && imageUrls.length > 0) {
        const filePaths = imageUrls.map(url => {
            const parts = url.split('/');
            // Assumes URL structure is .../product-images/user_id/filename.jpg
            return parts.slice(parts.indexOf('product-images') + 1).join('/');
        });
        const { error: storageError } = await supabase.storage.from('product-images').remove(filePaths);
        if (storageError) {
          console.error("Storage Error:", storageError);
          // Non-fatal, we can still delete the DB record.
          toast({ title: "Warning", description: "Could not delete product images, but removed listing.", variant: "destructive" });
        }
      }

      // 2. Delete the product record from the database
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Listing Deleted",
        description: `"${product.name}" has been successfully deleted.`
      });
      onDeleted();

    } catch (error: any) {
      console.error("Delete Error:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete the listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      onClose();
    }
  }

  if (!product) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the listing for
            <span className="font-bold"> "{product.name}"</span> and remove its images from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, delete it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
