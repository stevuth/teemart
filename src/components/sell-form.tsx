
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
import { Loader } from "@/components/ui/loader";
import { X } from "lucide-react";
import { categories, conditions, Product } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createOrUpdateProductAction } from "@/app/actions/product";

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

// Zod schema for the form
const formSchema = z.object({
  name: z.string().min(5, { message: "Product name must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val),
    z.number({ invalid_type_error: "Price must be a number." }).positive({ message: "Price must be a positive number." })
  ),
  deliveryFee: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val)),
    z.number({ invalid_type_error: "Delivery fee must be a number." }).positive().optional()
  ),
  category: z.enum(categories, { errorMap: () => ({ message: "Please select a category." }) }),
  condition: z.enum(conditions, { errorMap: () => ({ message: "Please select a condition." }) }),
  location: z.string().min(1, { message: "Please select a location." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  images: z.any().optional(), // We'll handle image validation manually
});


type ProductFormValues = z.infer<typeof formSchema>;

type SellFormProps = {
  existingProduct?: Product | null;
}

export function SellForm({ existingProduct }: SellFormProps) {
  const { toast } = useToast();
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const isEditMode = !!existingProduct;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingProduct?.name || "",
      description: existingProduct?.description || "",
      price: existingProduct?.price,
      deliveryFee: existingProduct?.deliveryFee,
      category: existingProduct?.category,
      condition: existingProduct?.condition,
      location: existingProduct?.location || '',
      city: existingProduct?.city || '',
      images: undefined,
    },
  });
  
  useEffect(() => {
    if (isEditMode && existingProduct?.image) {
        const fullUrls = (existingProduct.image as string[]).map(path => {
            if (!path) return null;
            if (path.startsWith('http')) return path;
            return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        }).filter(Boolean) as string[];
        setImagePreviews(fullUrls);
    }
  }, [existingProduct, isEditMode, supabase]);

  const { isSubmitting } = form.formState;
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (imagePreviews.length + files.length > MAX_FILES) {
        toast({
            title: "Too many images",
            description: `You can only have a total of ${MAX_FILES} images.`,
            variant: "destructive",
        });
        return;
    }

    const validFiles = files.filter(file => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            toast({ title: "Invalid File Type", description: `${file.name} is not a supported image type.`, variant: "destructive" });
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast({ title: "File Too Large", description: `${file.name} exceeds the 3MB size limit.`, variant: "destructive" });
            return false;
        }
        return true;
    });

    const combinedFiles = [...imageFiles, ...validFiles];
    setImageFiles(combinedFiles);
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };
  
  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    
    const removedPreview = newPreviews.splice(index, 1)[0];
    setImagePreviews(newPreviews);
    
    // If the removed preview is a blob URL, it's a new file we need to remove from the files state.
    const fileIndexToRemove = imageFiles.findIndex(file => URL.createObjectURL(file) === removedPreview);
    if(fileIndexToRemove > -1) {
        newFiles.splice(fileIndexToRemove, 1);
        setImageFiles(newFiles);
    }
  }

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }

    const existingImagePaths = imagePreviews
        .filter(p => !p.startsWith('blob:'))
        .map(url => {
            const urlParts = new URL(url).pathname.split('/');
            return urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
        });

    if (existingImagePaths.length + imageFiles.length === 0) {
        form.setError("images", { type: "manual", message: "At least one image is required." });
        return;
    }

    try {
        let newImagePaths: string[] = [];
        
        if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(file => {
                const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                return supabase.storage.from('product-images').upload(fileName, file);
            });

            const uploadResults = await Promise.all(uploadPromises);

            for (const result of uploadResults) {
                if (result.error) {
                    throw new Error(`Failed to upload an image: ${result.error.message}`);
                }
                newImagePaths.push(result.data.path);
            }
        }
        
        const finalImagePaths = [...existingImagePaths, ...newImagePaths];

        const productData = {
            id: existingProduct?.id, // Include ID for updates
            user_id: user.id,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            condition: data.condition,
            location: data.location,
            city: data.city,
            image_url: finalImagePaths,
            delivery_fee: data.deliveryFee,
        };
        
        const result = await createOrUpdateProductAction(productData);

        if (result.error) {
            throw new Error(result.error);
        }

        toast({
            title: isEditMode ? "Listing Updated!" : "Listing Created!",
            description: `Your product has been successfully ${isEditMode ? 'updated' : 'listed'}.`,
        });

        router.push('/profile');
        router.refresh();
        
    } catch (error: any) {
        console.error("Submit Error: ", error);
        toast({
            title: "Operation Failed",
            description: error.message || "There was an error. Please try again.",
            variant: "destructive"
        });
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
        <Card>
        <CardHeader>
            <CardTitle className="text-3xl">{isEditMode ? "Edit Your Item" : "Sell Your Item"}</CardTitle>
            <CardDescription>{isEditMode ? "Update the details below." : "Fill out the details below to list your product."}</CardDescription>
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
                        <Input
                            type="number"
                            step="any"
                            placeholder="Enter price"
                            {...field}
                            value={field.value ?? ''}
                        />
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
                          <Input
                            type="number"
                            step="any"
                            placeholder="Enter delivery fee"
                            {...field}
                            value={field.value ?? ''}
                          />
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your state" />
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
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Ikeja" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                
                <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
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
                {isSubmitting ? <Loader variant="spinner" className="mr-2" /> : isEditMode ? "Update Listing" : "Create Listing" }
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
