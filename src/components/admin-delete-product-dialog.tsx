
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
    if (!product) return;
    setLoading(true);

    try {
      // 1. Delete images from storage
      const imageUrls = product.image;
      if (imageUrls && imageUrls.length > 0) {
        const filePaths = imageUrls.map(url => {
            // A more robust way to extract the path after the bucket name.
            // Example URL: https://<project>.supabase.co/storage/v1/object/public/product-images/user_id/image.png
            // We want to extract 'user_id/image.png'
            try {
              const urlObject = new URL(url);
              const pathSegments = urlObject.pathname.split('/');
              // Find the index of the bucket name and slice from there
              const bucketIndex = pathSegments.indexOf('product-images');
              if (bucketIndex !== -1) {
                return pathSegments.slice(bucketIndex + 1).join('/');
              }
              return '';
            } catch (e) {
                console.error("Invalid image URL:", url, e);
                return '';
            }
        }).filter(Boolean);

        if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage.from('product-images').remove(filePaths);
            if (storageError) {
              // Log the error but don't stop the DB deletion.
              console.error("Storage Deletion Error:", storageError);
              toast({ title: "Image Deletion Warning", description: "Could not delete all product images from storage.", variant: "destructive" });
            }
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
