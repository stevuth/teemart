
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";
import { categories, conditions } from "@/lib/types";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const locations: string[] = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe',
    'Zamfara', 'FCT - Abuja'
];

const formSchema = z.object({
  name: z.string().min(5, { message: "Product name must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  price: z.coerce.number().min(1, { message: "Price must be at least 1." }),
  deliveryFee: z.coerce.number().optional(),
  category: z.enum(categories, { errorMap: () => ({ message: "Please select a category." }) }),
  condition: z.enum(conditions, { errorMap: () => ({ message: "Please select a condition." }) }),
  location: z.string().min(1, { message: "Please select a location." }),
  images: z.any()
    .refine((files: FileList | null | undefined) => files && files?.length >= 1, "At least one image is required.")
    .refine((files: FileList | null | undefined) => files && files?.length <= MAX_FILES, `You can upload a maximum of ${MAX_FILES} images.`)
    .refine(
        (files: FileList | null | undefined) => files && Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
        `Each file size must be less than 3MB.`
    )
    .refine(
        (files: FileList | null | undefined) => files && Array.from(files).every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
        "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type ProductFormValues = z.infer<typeof formSchema>;

export function SellForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
    },
  });

  const { isSubmitting } = form.formState;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentImages = imageFiles;
    const combined = [...currentImages, ...files].slice(0, MAX_FILES);
    
    setImageFiles(combined);

    const dataTransfer = new DataTransfer();
    combined.forEach(file => dataTransfer.items.add(file));
    form.setValue('images', dataTransfer.files, { shouldValidate: true });

    const newPreviews = combined.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };
  
  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue('images', dataTransfer.files, { shouldValidate: true });

    const updatedPreviews = updatedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(updatedPreviews);
  }

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to list a product.",
            variant: "destructive"
        });
        return;
    }

    const imageUrls: string[] = [];
    const uploadedFilePaths: string[] = [];

    if (!data.images) return;

    for (const imageFile of Array.from(data.images)) {
        const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('product-images')
            .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
             console.error("Image Upload Error: ", uploadError);
             toast({
                title: "Image Upload Failed",
                description: `Error uploading ${imageFile.name}. Please try again.`,
                variant: "destructive"
             });
             if (uploadedFilePaths.length > 0) {
                await supabase.storage.from('product-images').remove(uploadedFilePaths);
             }
             return;
        }

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
        imageUrls.push(publicUrl);
        uploadedFilePaths.push(uploadData.path);
    }
        
    const { error: insertError } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        location: data.location,
        image_url: imageUrls,
        delivery_fee: data.deliveryFee || null,
      });
      
    if (insertError) {
        console.error("Database Insert Error: ", insertError);
        toast({
            title: "Listing Creation Failed",
            description: "There was an error creating your listing. Please try again.",
            variant: "destructive"
        });
        await supabase.storage.from('product-images').remove(uploadedFilePaths);
        return;
    }

    toast({
      title: "Listing Created!",
      description: "Your product has been successfully listed for sale.",
    });
    form.reset();
    setImagePreviews([]);
    setImageFiles([]);
    router.push(`/profile`);
  };

  return (
    <div className="max-w-3xl mx-auto">
        <Card>
        <CardHeader>
            <CardTitle className="text-3xl">Sell Your Item</CardTitle>
            <CardDescription>Fill out the details below to list your product on TeeMart.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., 2018 Toyota Corolla" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe your product in detail..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price (₦)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Enter price" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                    <FormField
                    control={form.control}
                    name="deliveryFee"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Delivery Fee (₦) <span className="text-muted-foreground">(Optional)</span></FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Enter delivery fee" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                    <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {conditions.map(con => <SelectItem key={con} value={con}>{con}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>

                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your location" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="images"
                render={({ field: { onChange, value, ...rest }}) => (
                    <FormItem>
                        <FormLabel>Product Images</FormLabel>
                            <FormControl>
                            <Input 
                                type="file"
                                accept="image/png, image/jpeg, image/webp" 
                                multiple
                                onChange={handleImageChange}
                                disabled={imagePreviews.length >= MAX_FILES}
                            />
                        </FormControl>
                        <FormDescription>
                            You can upload up to {MAX_FILES} images. Max 3MB each.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
                />

                {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {imagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square">
                            <Image src={src} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => removeImage(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Listing"}
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
