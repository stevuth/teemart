
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
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
    const { user, loading: authLoading, supabase } = useAuth();
    const searchParams = useSearchParams();
    router = useRouter();
    const pathname = usePathname();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const selectedConversationId = searchParams.get('conversationId');

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
            }
            setLoading(false);
        };

        if (!authLoading && user) {
            fetchConversations();
        }
    }, [user, authLoading, supabase]);

    const handleSelectConversation = (conversationId: string) => {
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
    
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);
    
    if (selectedConversationId && selectedConversation) {
        return (
             <ChatInterface
                conversationId={selectedConversation.id}
                recipient={selectedConversation.other_participant}
                onBack={handleBackToList}
            />
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <Header />
            <main className="flex-grow flex flex-col border-t overflow-hidden">
                {/* Conversation List */}
                <div className="flex flex-col h-full">
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
                                    onClick={() => handleSelectConversation(convo.id)}
                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent"
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
            </main>
            <Footer />
        </div>
    );
}


export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <MessagingPage />
        </Suspense>
    )
}
