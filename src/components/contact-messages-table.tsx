
"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ChevronsUpDown, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Textarea } from './ui/textarea';

type ContactMessage = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'replied';
  reply_message: string | null;
};

async function sendReplyAction(messageId: string, replyContent: string) {
    'use server';
    // In a real app, you'd use a service like Resend or Nodemailer to send an email.
    // For this prototype, we will just update the database and log to console.
    
    const { data: message, error: fetchError } = await supabase
        .from('contact_messages')
        .select('email, name, message')
        .eq('id', messageId)
        .single();
    
    if (fetchError || !message) {
        console.error('Failed to fetch message for reply:', fetchError);
        return { error: 'Failed to fetch original message.' };
    }

    console.log("--- SIMULATING EMAIL ---");
    console.log(`To: ${message.email}`);
    console.log(`Subject: Re: Your inquiry to TeeMart`);
    console.log(`Hi ${message.name},\n\nThank you for contacting us. Here is our response to your message:\n\n---\n\n${replyContent}\n\n---\n\nOriginal message:\n"${message.message}"\n\nRegards,\nThe TeeMart Team`);
    console.log("--- END SIMULATION ---");

    const { error: updateError } = await supabase
        .from('contact_messages')
        .update({
            status: 'replied',
            reply_message: replyContent,
        })
        .eq('id', messageId);

    if (updateError) {
        console.error('Failed to update message status:', updateError);
        return { error: 'Failed to send reply.' };
    }
    
    return { success: true };
}


function ReplyForm({ messageId, onReplied }: { messageId: string, onReplied: () => void }) {
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (replyContent.trim().length < 10) {
            toast({ title: 'Reply too short', description: 'Please write a more detailed reply.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        const result = await sendReplyAction(messageId, replyContent);
        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Your reply has been sent.' });
            setReplyContent('');
            onReplied();
        }
        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
            <Textarea 
                placeholder="Type your reply here..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
            />
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Reply
                </Button>
            </div>
        </form>
    );
}


export function ContactMessagesTable() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching messages:", error);
            toast({ title: "Error", description: "Could not fetch contact messages.", variant: "destructive" });
        } else {
            setMessages(data as ContactMessage[]);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contact Messages</CardTitle>
                <CardDescription>Messages submitted through the website's contact form.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-medium">No messages</h3>
                        <p className="mt-2 text-muted-foreground">The inbox is currently empty.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map(message => (
                            <Collapsible key={message.id} className="border p-4 rounded-lg">
                                <CollapsibleTrigger className="w-full">
                                    <div className="flex justify-between items-center">
                                        <div className="text-left">
                                            <p className="font-semibold">{message.name} <span className="text-sm text-muted-foreground">&lt;{message.email}&gt;</span></p>
                                            <p className="text-sm text-muted-foreground">
                                                Received {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={message.status === 'replied' ? 'secondary' : 'default'}>
                                                {message.status}
                                            </Badge>
                                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-4 mt-4 border-t">
                                    <p className="text-muted-foreground whitespace-pre-wrap">{message.message}</p>
                                    {message.status === 'replied' && message.reply_message && (
                                        <div className="mt-4 p-4 bg-secondary/50 rounded-md">
                                            <p className="font-semibold text-sm">Your Reply:</p>
                                            <p className="text-muted-foreground whitespace-pre-wrap mt-2">{message.reply_message}</p>
                                        </div>
                                    )}
                                    {message.status === 'new' && (
                                        <ReplyForm messageId={message.id} onReplied={fetchMessages} />
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
