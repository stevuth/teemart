
"use client";

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CartItem } from '@/contexts/cart-context';
import type { Profile } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { initializeTransactionAction } from '@/app/actions/paystack';

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
    const router = useRouter();
    const { user } = useAuth();

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: userProfile?.full_name || "",
            phone: userProfile?.phone || "",
            address: "",
        },
    });
    
    const [isProcessing, setIsProcessing] = useState(false);

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
        if (!user || !user.email) {
            toast({ title: "Error", description: "You must be logged in to proceed.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);

        const metadata = {
            buyer_id: user.id,
            customer_name: data.name,
            customer_phone: data.phone,
            delivery_address: data.address,
            cartItems: cartItems.map(item => ({ 
                id: item.id, 
                name: item.name, 
                price: item.price, 
                quantity: item.quantity,
                user_id: item.user_id,
                deliveryFee: item.deliveryFee
            })),
            shipping_fee: calculations.shippingFeeNum,
        };

        const result = await initializeTransactionAction(
            user.email,
            calculations.totalPayable,
            metadata
        );

        if (result.success && result.data) {
            window.location.href = result.data.authorization_url;
        } else {
            toast({
                title: "Payment Initialization Failed",
                description: result.error || "An unknown error occurred.",
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-bold">Your Payment is Protected</AlertTitle>
                    <AlertDescription className="text-foreground/80">
                        Your payment is held securely by TeeMart until you confirm you have received your order. You can request a full refund if the product isn't delivered.
                    </AlertDescription>
                </Alert>

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

                            <Button type="submit" className="w-full" size="lg" disabled={calculations.subtotalNum <= 0 || isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
