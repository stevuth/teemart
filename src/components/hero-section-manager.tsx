
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type HeroImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export function HeroSectionManager() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { supabase } = useAuth();

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_images')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching hero images:', error);
      toast({ title: 'Error', description: 'Could not fetch hero images.', variant: 'destructive' });
    } else {
      setImages(data);
    }
    setLoading(false);
  }, [toast, supabase]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please use JPG, PNG, or WEBP.", variant: "destructive" });
        return;
      }
      if (file.size > 6 * 1024 * 1024) { // 6MB Limit
        toast({ title: "File Too Large", description: "Image must be under 6MB.", variant: "destructive" });
        return;
      }
      setFileToUpload(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);

    const fileName = `public/${Date.now()}_${fileToUpload.name}`;
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hero-section-images')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('hero-section-images').getPublicUrl(uploadData.path);
      
      const { error: dbError } = await supabase
        .from('hero_images')
        .insert({ image_url: publicUrl, alt_text: 'Hero image' });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Hero image uploaded successfully.' });
      setFileToUpload(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchImages(); // Refresh list

    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (image: HeroImage) => {
    try {
      // Extract file path from URL
      const url = new URL(image.image_url);
      const filePath = url.pathname.split('/hero-section-images/')[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('hero-section-images')
        .remove([filePath]);
      
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', image.id);
      
      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Hero image deleted.' });
      fetchImages(); // Refresh list

    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Hero Image</CardTitle>
          <CardDescription>Add a new image to the homepage carousel. Recommended size: 1920x822px.</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="hidden" />
            {imagePreview ? (
              <div className="relative aspect-[21/9] max-h-48 mx-auto">
                <Image src={imagePreview} alt="Preview" fill className="object-contain rounded-md" />
                 <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFileToUpload(null);
                        setImagePreview(null);
                        if(fileInputRef.current) fileInputRef.current.value = "";
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span>Click to select an image</span>
                <span className="text-xs">PNG, JPG, or WEBP (max 6MB)</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={isUploading || !fileToUpload}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Image
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Hero Images</CardTitle>
          <CardDescription>These are the images currently displayed on your homepage carousel.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : images.length === 0 ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Hero Images Found</AlertTitle>
                <AlertDescription>
                    Your homepage carousel is empty. Upload an image above to get started.
                </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map(image => (
                <div key={image.id} className="relative group">
                  <Image src={image.image_url} alt={image.alt_text || 'Hero image'} width={400} height={171} className="rounded-md object-cover border" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(image)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
