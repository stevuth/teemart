
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "./ui/label";

export function ContactForm() {
  const formSubmitUrl = "https://formsubmit.co/support@teemart.ng";
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/contact` : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Still have questions?</CardTitle>
        <CardDescription>
          If you couldn't find an answer in the FAQ, please fill out the form below to contact us directly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formSubmitUrl} method="POST" className="space-y-6">
           {/* FormSubmit Hidden Inputs */}
           <input type="hidden" name="_next" value={redirectUrl} />
           <input type="hidden" name="_captcha" value="false" />
           <input type="hidden" name="_template" value="table" />

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" name="name" placeholder="Adewunmi James" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea id="message" name="message" placeholder="Please describe your issue or question here..." required rows={5} />
            </div>

            <Button type="submit">
                Send Message
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
