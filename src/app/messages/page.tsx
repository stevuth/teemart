
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInterface } from '@/components/chat-interface';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import { useNotifications } from '@/hooks/use-notifications';

type Conversation = {
    id: string;
    last_message_at: string;
    last_message_content: string | null;
    last_message_sender_id: string | null;
    unread_count: number;
    other_participant: {
        id: string;
        full_name: string;
        avatar_url: string;
    }
}

function MessagingPage() {
    useScrollToTop();
    const { user, loading: authLoading, supabase } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { fetchUnreadCount, notificationCount, decrementCount } = useNotifications();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const selectedConversationId = searchParams.get('conversationId');

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .rpc('get_user_conversations');

        if (error) {
            console.error('Error fetching conversations:', JSON.stringify(error, null, 2));
        } else {
            setConversations(data || []);
        }
        setLoading(false);
    }, [user, supabase]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchConversations();
        }
    }, [user, authLoading, fetchConversations]);

    const handleSelectConversation = async (conversationId: string) => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation && conversation.unread_count > 0) {
            const { error } = await supabase.rpc('mark_conversation_as_read', { p_conversation_id: conversationId });
            if (!error) {
                decrementCount(conversation.unread_count);
                // Refresh local state to hide unread indicator
                setConversations(convos => convos.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c));
            }
        }
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('conversationId', conversationId);
        router.push(`${pathname}?${newParams.toString()}`);
    }

    const handleBackToList = () => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('conversationId');
        router.push(`${pathname}?${newParams.toString()}`);
    }

    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    if (authLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!user) {
         return (
             <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="font-semibold">Please log in</h3>
                        <p className="text-sm">You need to be logged in to view your messages.</p>
                    </div>
                </main>
                <Footer />
            </div>
         );
    }
    
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    // If a conversation is selected, only render the chat interface.
    if (selectedConversationId && selectedConversation) {
        return (
            <ChatInterface
                conversationId={selectedConversation.id}
                recipient={selectedConversation.other_participant}
                onBack={handleBackToList}
            />
        );
    }

    // Otherwise, render the conversation list in a full-page layout.
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <div className="flex-grow flex flex-col">
                <div className="p-4 border-b sticky top-16 bg-background z-10">
                    <h1 className="text-xl font-bold">Messages</h1>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : conversations.length > 0 ? (
                        conversations.map(convo => (
                            <div
                                key={convo.id}
                                onClick={() => handleSelectConversation(convo.id)}
                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent border-b"
                            >
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={convo.other_participant.avatar_url || ''} />
                                    <AvatarFallback>{getInitials(convo.other_participant.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold truncate">{convo.other_participant.full_name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {convo.last_message_content ? (
                                            <>
                                                {convo.last_message_sender_id === user?.id && 'You: '}
                                                {convo.last_message_content}
                                            </>
                                        ) : 'No messages yet'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                {convo.last_message_at && (
                                    <p className="text-xs text-muted-foreground self-start flex-shrink-0">
                                        {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                                    </p>
                                )}
                                {convo.unread_count > 0 && (
                                    <span className="h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                                        {convo.unread_count}
                                    </span>
                                )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                            <h3 className="font-semibold">No Conversations</h3>
                            <p className="text-sm">Start a chat from a seller's profile.</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MessagingPage />
        </Suspense>
    )
}
