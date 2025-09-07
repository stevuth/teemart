
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

type AdminDeleteProductDialogProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function AdminDeleteProductDialog({ product, isOpen, onClose, onDeleted }: AdminDeleteProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { supabase } = useAuth();

  const handleDelete = async () => {
    if (!product || !supabase) return;
    setLoading(true);

    try {
      // 1. Delete images from storage
      const imagePaths = product.image; // This now correctly gets the array of paths
      if (imagePaths && imagePaths.length > 0) {
        // The `image` field now correctly contains paths, not full URLs.
        // We can use the array of paths directly.
        const { error: storageError } = await supabase.storage.from('product-images').remove(imagePaths);
        if (storageError) {
          // Log the error but don't stop the DB deletion.
          // This prevents the user from being stuck if a file is already deleted or path is wrong.
          console.error("Storage Deletion Error:", storageError);
          toast({ title: "Image Deletion Warning", description: "Could not delete all product images from storage. They may have been removed already.", variant: "destructive" });
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
            <span className="font-bold"> "{product.name}"</span> and remove its images from our servers. This is an admin action.
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
