
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { categories, conditions, locations } from "@/lib/types";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(5, { message: "Product name must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  price: z.coerce.number().min(1, { message: "Price must be at least 1." }),
  deliveryFee: z.coerce.number().optional(),
  category: z.enum(categories, { errorMap: () => ({ message: "Please select a category." }) }),
  condition: z.enum(conditions, { errorMap: () => ({ message: "Please select a condition." }) }),
  location: z.string().min(1, { message: "Please select a location." }),
  image: z.any().refine(files => files?.length === 1, "Product image is required."),
});

type ProductFormValues = z.infer<typeof formSchema>;

export default function SellPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to list a product.",
            variant: "destructive"
        });
        return;
    }

    const imageFile = data.image[0];
    const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
    
    // 1. Upload image to Supabase Storage
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
            description: "There was an error uploading your product image. Please try again.",
            variant: "destructive"
        });
        return;
    }

    // 2. Get public URL of the uploaded image
    const { data: { publicUrl } } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(uploadData.path);
        
    // 3. Insert product into the database
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
        image_url: publicUrl,
        delivery_fee: data.deliveryFee
      });
      
    if (insertError) {
        console.error("Database Insert Error: ", insertError);
        toast({
            title: "Listing Creation Failed",
            description: "There was an error creating your listing. Please try again.",
            variant: "destructive"
        });
        // Optional: delete the uploaded image if the db insert fails
        await supabase.storage.from('product-images').remove([fileName]);
        return;
    }

    toast({
      title: "Listing Created!",
      description: "Your product has been successfully listed for sale.",
    });
    form.reset();
    router.push(`/profile`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                    name="image"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Product Image</FormLabel>
                            <FormControl>
                                <Input 
                                    {...fieldProps} 
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp" 
                                    onChange={(event) => {
                                        onChange(event.target.files && event.target.files);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Listing"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
