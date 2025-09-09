
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { useAuth } from "@/hooks/use-auth";
import Link from 'next/link';
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const { toast } = useToast();
  const { supabase } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormValues) => {
    // 1. Sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });

    if (signInError) {
      toast({
        title: "Login Failed",
        description: signInError.message,
        variant: "destructive",
      });
      return;
    }
    
    // 2. Check for ban status immediately after successful authentication
    if (signInData.user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('banned_until')
            .eq('id', signInData.user.id)
            .single();

        // 3. Handle errors during profile fetch
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
             await supabase.auth.signOut(); // Log out user if profile check fails for security
             toast({ title: "Login Error", description: "Could not verify your account status. Please try again.", variant: "destructive" });
             return;
        }

        // 4. Check if the user is currently banned
        if (profile?.banned_until && new Date(profile.banned_until) > new Date()) {
            const banExpires = formatDistanceToNow(new Date(profile.banned_until), { addSuffix: true });
            await supabase.auth.signOut(); // Log out the banned user
            toast({
                title: "Account Suspended",
                description: `Your account is suspended. Access will be restored ${banExpires}.`,
                variant: "destructive",
                duration: 10000,
            });
            return; // Stop the function here
        }
    }

    // 5. If all checks pass, finalize the login
    toast({ title: "Login Successful", description: "Welcome back!" });
    onClose();
  };
  
  const handleForgotPasswordClick = () => {
    onClose(); // Close the login modal
    // The link will then navigate to the page
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
             <Image src="/logo.png" alt="TeeMart Logo" width={48} height={48} />
          </div>
          <DialogTitle>Welcome Back</DialogTitle>
           <DialogDescription>
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                    <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                         <Link href="/forgot-password" onClick={handleForgotPasswordClick} className="ml-auto inline-block text-sm underline">
                             Forgot password?
                        </Link>
                    </div>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                       >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader variant="spinner" className="mr-2" /> : "Login"}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Button variant="link" onClick={onSwitchToSignup} className="p-0 h-auto">
            Sign up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
