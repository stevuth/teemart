
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Paperclip, X, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
    onBack?: () => void;
}

export function ChatInterface({ conversationId, recipient, onBack }: ChatInterfaceProps) {
    const { user, supabase } = useAuth();
    const { toast } = useToast();
    const { decrementCount } = useNotifications();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
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
    }, [conversationId, user, supabase, decrementCount]);
    
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
    }, [conversationId, toast, markMessagesAsRead, supabase]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!user?.id || !conversationId) return;
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
    }, [conversationId, user?.id, markMessagesAsRead, supabase]);
    
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

        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            created_at: new Date().toISOString(),
            content,
            sender_id: user.id,
            image_url: imagePreview,
        };
        setMessages(current => [...current, optimisticMessage]);

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
            
            setMessages(current => current.map(m => m.id === optimisticId ? (data as Message) : m));

        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
            setMessages(current => current.filter(m => m.id !== optimisticId));
            setNewMessage(content);
        } finally {
            setIsSending(false);
        }
    };
    
    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <>
        <Dialog open={!!viewingImage} onOpenChange={(isOpen) => !isOpen && setViewingImage(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-2 bg-transparent border-0 flex items-center justify-center">
                {viewingImage && (
                    <Image 
                        src={viewingImage} 
                        alt="Full screen image view"
                        width={1920}
                        height={1080}
                        className="w-auto h-auto max-w-full max-h-full object-contain"
                    />
                )}
            </DialogContent>
        </Dialog>
        <div className="flex flex-col h-full bg-secondary">
            <div className="p-3 bg-card flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                 <Button onClick={onBack} variant="ghost" size="icon" className="md:hidden mr-2">
                    <ArrowLeft className="h-5 w-5" />
                 </Button>
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
                                    "flex flex-col items-end gap-1 w-full",
                                    message.sender_id === user?.id ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn("flex items-end gap-2 max-w-[80%]", message.sender_id === user?.id ? "flex-row-reverse" : "flex-row")}>
                                     {message.sender_id !== user?.id && (
                                        <Avatar className="h-8 w-8 self-start">
                                            <AvatarImage src={recipient.avatar_url || ''} />
                                            <AvatarFallback>{getInitials(recipient.full_name)}</AvatarFallback>
                                        </Avatar>
                                     )}
                                     {message.sender_id === user?.id && <div className="w-8 flex-shrink-0"></div>}
                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl",
                                            message.sender_id === user?.id
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-background rounded-bl-none"
                                        )}
                                    >
                                        {message.image_url && (
                                            <button 
                                                onClick={() => setViewingImage(message.image_url!)}
                                                className="relative h-48 w-48 mb-2 cursor-pointer group"
                                            >
                                                <Image src={message.image_url} alt="Sent image" layout="fill" className="rounded-md object-cover transition-transform group-hover:scale-105" />
                                                 {message.id.startsWith('temp-') && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                        {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
                                    </div>
                                </div>
                                <p className={cn("text-xs text-muted-foreground px-2", message.sender_id === user?.id ? "pr-12" : "pl-12")}>
                                    {format(new Date(message.created_at), 'HH:mm')}
                                </p>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-2 border-t bg-background sticky bottom-0">
                {imagePreview && (
                    <div className="relative w-24 h-24 mb-2 ml-2">
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
        </>
    );
}
