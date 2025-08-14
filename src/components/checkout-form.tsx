
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function CheckoutForm() {
    const [subtotal, setSubtotal] = useState('50000');
    const [shippingFee, setShippingFee] = useState('2500');
    const { toast } = useToast();

    const calculations = useMemo(() => {
        const subtotalNum = parseFloat(subtotal) || 0;
        const shippingFeeNum = parseFloat(shippingFee) || 0;

        const buyerEscrowShare = subtotalNum * 0.03;
        const sellerEscrowShare = subtotalNum * 0.02;
        const totalPayable = subtotalNum + buyerEscrowShare + shippingFeeNum;
        const sellerPayout = subtotalNum - sellerEscrowShare;

        return {
            subtotalNum,
            shippingFeeNum,
            buyerEscrowShare,
            sellerEscrowShare,
            totalPayable,
            sellerPayout
        };
    }, [subtotal, shippingFee]);

    const formatCurrency = (amount: number) => {
        return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    const handleCheckout = () => {
        // Mock payment function
        console.log("Processing payment...", {
            subtotal: calculations.subtotalNum,
            shipping: calculations.shippingFeeNum,
            total: calculations.totalPayable,
        });

        toast({
            title: "Payment Successful!",
            description: "Your order has been placed.",
        });
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Enter your order details and review the final amounts below.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* --- INPUTS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subtotal">Item(s) Subtotal (₦)</Label>
                            <Input 
                                id="subtotal" 
                                type="number" 
                                placeholder="e.g., 50000" 
                                value={subtotal}
                                onChange={(e) => setSubtotal(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="shipping">Shipping Fee (₦) <span className="text-muted-foreground">(Optional)</span></Label>
                            <Input 
                                id="shipping" 
                                type="number" 
                                placeholder="e.g., 2500" 
                                value={shippingFee}
                                onChange={(e) => setShippingFee(e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* --- ESCROW BREAKDOWN --- */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                            Escrow Commission Breakdown
                        </h3>
                        <div className="space-y-3 rounded-lg border bg-secondary/30 p-4">
                            <InfoRow label="Buyer's Escrow Share (3%)" value={formatCurrency(calculations.buyerEscrowShare)} />
                            <InfoRow label="Seller's Escrow Share (2%)" value={formatCurrency(calculations.sellerEscrowShare)} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            A 5% escrow fee is applied to the subtotal to protect both buyer and seller.
                        </p>
                    </div>

                    <Separator />

                    {/* --- FINAL AMOUNTS --- */}
                    <div>
                         <h3 className="text-lg font-medium mb-4">Final Amounts</h3>
                         <div className="space-y-4">
                            <InfoRow label="Item Subtotal" value={formatCurrency(calculations.subtotalNum)} />
                            <InfoRow label="Shipping Fee" value={formatCurrency(calculations.shippingFeeNum)} />
                            <InfoRow label="Your Escrow Fee" value={formatCurrency(calculations.buyerEscrowShare)} className="text-primary" />
                            <Separator />
                            <InfoRow label="Total You Pay" value={formatCurrency(calculations.totalPayable)} isTotal={true} />
                         </div>
                         <div className="mt-4 rounded-lg border border-dashed p-4">
                             <InfoRow label="Seller Receives" value={formatCurrency(calculations.sellerPayout)} className="text-green-700" />
                             <p className="text-xs text-muted-foreground mt-1">
                                (Subtotal minus their 2% escrow share)
                             </p>
                         </div>
                    </div>

                    {/* --- CHECKOUT BUTTON --- */}
                    <Button onClick={handleCheckout} className="w-full" size="lg" disabled={calculations.subtotalNum <= 0}>
                        Proceed to Pay {formatCurrency(calculations.totalPayable)}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const InfoRow = ({ label, value, className, isTotal = false }: { label: string, value: string, className?: string, isTotal?: boolean }) => (
    <div className={cn("flex justify-between items-center", className)}>
        <p className={cn("text-muted-foreground", isTotal && "font-bold text-foreground")}>{label}</p>
        <p className={cn("font-medium", isTotal && "text-2xl font-bold")}>{value}</p>
    </div>
);
