
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInterface } from '@/components/chat-interface';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Conversation = {
    id: string;
    last_message_at: string;
    last_message_content: string | null;
    last_message_sender_id: string | null;
    other_participant: {
        id: string;
        full_name: string;
        avatar_url: string;
    }
}

function MessagingPage() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    useEffect(() => {
        const conversationId = searchParams.get('conversationId');
        if (conversationId) {
            setSelectedConversationId(conversationId);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user) return;
            setLoading(true);

            const { data, error } = await supabase
                .rpc('get_user_conversations', { p_user_id: user.id });

            if (error) {
                console.error('Error fetching conversations', error);
            } else {
                setConversations(data || []);
                const conversationIdFromUrl = searchParams.get('conversationId');
                if (conversationIdFromUrl && data.some((c: Conversation) => c.id === conversationIdFromUrl)) {
                    setSelectedConversationId(conversationIdFromUrl);
                } else if (!selectedConversationId && data && data.length > 0) {
                    setSelectedConversationId(data[0].id);
                }
            }
            setLoading(false);
        };

        if (!authLoading && user) {
            fetchConversations();
        }
    }, [user, authLoading, searchParams]);

    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-grow flex border-t">
                <div className="flex-shrink-0 w-full md:w-80 lg:w-96 border-r flex flex-col">
                    <div className="p-4 border-b">
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
                                    onClick={() => setSelectedConversationId(convo.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 cursor-pointer hover:bg-accent",
                                        selectedConversationId === convo.id && 'bg-accent'
                                    )}
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
                                    {convo.last_message_at && (
                                        <p className="text-xs text-muted-foreground self-start flex-shrink-0">
                                            {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                                        </p>
                                    )}
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
                <div className="flex-grow flex flex-col bg-secondary/30">
                    {selectedConversation ? (
                        <ChatInterface
                            conversationId={selectedConversation.id}
                            recipient={selectedConversation.other_participant}
                        />
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground">
                             {loading ? (
                                <Skeleton className="h-24 w-24 rounded-full" />
                             ) : (
                                <>
                                    <MessageSquare className="h-24 w-24 mb-4" />
                                    <h2 className="text-xl font-bold">Select a conversation</h2>
                                    <p>Choose a conversation from the left to start chatting.</p>
                                </>
                             )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}


export default function MessagesPage() {
    return (
        // Suspense is required for pages that use useSearchParams
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <MessagingPage />
        </Suspense>
    )
}
