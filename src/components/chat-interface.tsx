
"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Message = {
    id: string;
    created_at: string;
    content: string;
    sender_id: string;
}

type Recipient = {
    id: string;
    full_name: string;
    avatar_url: string;
}

type ChatInterfaceProps = {
    conversationId: string;
    recipient: Recipient;
}

export function ChatInterface({ conversationId, recipient }: ChatInterfaceProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error("Error fetching messages", error);
            } else {
                setMessages(data);
            }
            setLoading(false);
        };

        if (conversationId) {
            fetchMessages();
        }
    }, [conversationId]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                (payload) => {
                    setMessages(currentMessages => [...currentMessages, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        const content = newMessage;
        setNewMessage('');
        setIsSending(true);

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            recipient_id: recipient.id,
            content: content,
        });

        if (error) {
            toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
            setNewMessage(content); // Restore message on failure
        }
        setIsSending(false);
    };
    
    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={recipient.avatar_url || ''} />
                    <AvatarFallback>{getInitials(recipient.full_name)}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold">{recipient.full_name}</h2>
            </div>

            <div className="flex-grow p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex items-end gap-2",
                                    message.sender_id === user?.id ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.sender_id !== user?.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={recipient.avatar_url || ''} />
                                        <AvatarFallback>{getInitials(recipient.full_name)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl",
                                        message.sender_id === user?.id
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-background rounded-bl-none border"
                                    )}
                                >
                                    <p className="text-sm">{message.content}</p>
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
