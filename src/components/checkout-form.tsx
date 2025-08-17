
"use client";

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createOrderAction } from '@/app/actions/order';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CartItem } from '@/contexts/cart-context';
import type { Profile } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }),
});

type CheckoutFormValues = z.infer<typeof formSchema>;

type CheckoutFormProps = {
    subtotal: number;
    shippingFee: number;
    cartItems: CartItem[];
    userProfile: Profile | null;
}

export function CheckoutForm({ subtotal, shippingFee, cartItems, userProfile }: CheckoutFormProps) {
    const { toast } = useToast();
    const { clearCart } = useCart();
    const router = useRouter();

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: userProfile?.full_name || "",
            phone: userProfile?.phone || "",
            address: "",
        },
    });
    
    const { isSubmitting } = form.formState;

    const calculations = useMemo(() => {
        const subtotalNum = subtotal || 0;
        const shippingFeeNum = shippingFee || 0;
        const buyerEscrowShare = subtotalNum * 0.03;
        const totalPayable = subtotalNum + buyerEscrowShare + shippingFeeNum;

        return {
            subtotalNum,
            shippingFeeNum,
            buyerEscrowShare,
            totalPayable,
        };
    }, [subtotal, shippingFee]);
    
    const onSubmit = async (data: CheckoutFormValues) => {
        const orderData = {
            customer_name: data.name,
            customer_phone: data.phone,
            delivery_address: data.address,
            cartItems: cartItems,
            subtotal: calculations.subtotalNum,
            shippingFee: calculations.shippingFeeNum,
            escrowFee: calculations.buyerEscrowShare,
            totalAmount: calculations.totalPayable,
        };
        
        const result = await createOrderAction(orderData);

        if (result.error) {
            toast({
                title: "Order Failed",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Order Placed Successfully!",
                description: "Thank you for your purchase.",
            });
            clearCart();
            router.push('/profile');
        }
    };


    const formatCurrency = (amount: number) => {
        return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your full name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your active phone number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delivery Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter your full delivery address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                        <CardDescription>Review your order details and the final amounts below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                             <div>
                                 <h3 className="text-lg font-medium mb-4">Final Amounts</h3>
                                 <div className="space-y-4">
                                    <InfoRow label="Item Subtotal" value={formatCurrency(calculations.subtotalNum)} />
                                    <InfoRow label="Shipping Fee" value={formatCurrency(calculations.shippingFeeNum)} />
                                    <InfoRow label="Your Escrow Fee (3%)" value={formatCurrency(calculations.buyerEscrowShare)} className="text-primary" />
                                    <Separator />
                                    <InfoRow label="Total You Pay" value={formatCurrency(calculations.totalPayable)} isTotal={true} />
                                 </div>
                             </div>

                            <Button type="submit" className="w-full" size="lg" disabled={calculations.subtotalNum <= 0 || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Pay {formatCurrency(calculations.totalPayable)}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}

const InfoRow = ({ label, value, className, isTotal = false }: { label: string, value: string, className?: string, isTotal?: boolean }) => (
    <div className={cn("flex justify-between items-center", className)}>
        <p className={cn("text-muted-foreground", isTotal && "font-bold text-foreground")}>{label}</p>
        <p className={cn("font-medium", isTotal && "text-2xl font-bold")}>{value}</p>
    </div>
);
