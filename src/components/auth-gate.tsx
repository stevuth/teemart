
"use client";

import { useAuthModal } from '@/hooks/use-auth-modal';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UserCheck } from 'lucide-react';

export function AuthGate() {
    const { openLoginModal, openSignupModal } = useAuthModal();

    return (
        <div className="max-w-md mx-auto mt-16">
            <Card>
                <CardHeader className="text-center">
                    <UserCheck className="h-12 w-12 mx-auto text-primary mb-4" />
                    <CardTitle className="text-2xl">Please Sign In</CardTitle>
                    <CardDescription>
                        You need an account to continue with your purchase. Please sign in or create a new account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={openLoginModal} className="w-full" size="lg">Login</Button>
                    <Button onClick={openSignupModal} variant="secondary" className="w-full" size="lg">Create Account</Button>
                </CardContent>
            </Card>
        </div>
    );
}
