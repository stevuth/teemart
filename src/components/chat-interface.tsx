
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import Image from 'next/image';

type Message = {
    id: string;
    created_at: string;
    content: string;
    sender_id: string;
    image_url?: string | null;
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
    const { decrementCount } = useNotifications();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const markMessagesAsRead = useCallback(async () => {
        if (!user || !conversationId) return;
        const { error } = await supabase.rpc('mark_messages_as_read', {
            p_conversation_id: conversationId,
            p_user_id: user.id
        });
        if (error) {
            console.error("Error marking messages as read:", error);
        } else {
             decrementCount(0);
        }
    }, [conversationId, user, decrementCount]);
    
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
                toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
            } else {
                setMessages(data);
                markMessagesAsRead();
            }
            setLoading(false);
        };

        if (conversationId) {
            fetchMessages();
        }
    }, [conversationId, toast, markMessagesAsRead]);
    
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
                    const newMessagePayload = payload.new as Message;
                    if (newMessagePayload.sender_id !== user?.id) {
                         setMessages(currentMessages => [...currentMessages, newMessagePayload]);
                         markMessagesAsRead();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, user?.id, markMessagesAsRead]);
    
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: "File too large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageFile) || !user || isSending) return;

        setIsSending(true);
        const content = newMessage;
        let imageUrl: string | null = null;

        // Optimistic UI update
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            created_at: new Date().toISOString(),
            content,
            sender_id: user.id,
            image_url: imagePreview,
        };
        setMessages(current => [...current, optimisticMessage]);

        // Clear inputs
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        try {
            if (imageFile) {
                const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(uploadData.path);
                imageUrl = publicUrl;
            }

            const { data, error } = await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: user.id,
                recipient_id: recipient.id,
                content: content,
                image_url: imageUrl,
            }).select().single();

            if (error) throw error;
            
            // Replace optimistic message with real one
            setMessages(current => current.map(m => m.id === optimisticId ? (data as Message) : m));

        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
            setMessages(current => current.filter(m => m.id !== optimisticId)); // Revert optimistic update
            setNewMessage(content); // Restore message content
        } finally {
            setIsSending(false);
        }
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
                                    "flex flex-col items-end gap-2",
                                    message.sender_id === user?.id ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn("flex items-end gap-2", message.sender_id === user?.id ? "flex-row-reverse" : "flex-row")}>
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
                                        {message.image_url && (
                                            <div className="relative h-48 w-48 mb-2">
                                                <Image src={message.image_url} alt="Sent image" layout="fill" className="rounded-md object-cover" />
                                                 {message.id.startsWith('temp-') && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
                                    </div>
                                </div>
                                <p className={cn("text-xs text-muted-foreground px-2", message.sender_id === user?.id ? "text-right" : "text-left ml-10")}>
                                    {format(new Date(message.created_at), 'HH:mm')}
                                </p>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-background">
                {imagePreview && (
                    <div className="relative w-24 h-24 mb-2">
                        <Image src={imagePreview} alt="Image preview" layout="fill" className="rounded-md object-cover" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => {
                                setImagePreview(null);
                                setImageFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                    <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        autoComplete="off"
                        className="flex-grow"
                    />
                    <Button type="submit" size="icon" disabled={(!newMessage.trim() && !imageFile) || isSending}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
