-- Drop existing policies and functions if they exist to ensure a clean slate.
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid);
DROP FUNCTION IF EXISTS public.get_unread_message_count();

-- Helper function to check if the current user is a participant in a conversation.
-- This is a secure and reusable way to check permissions.
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable RLS on the messages table if it's not already enabled.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- Policy: Allow users to SELECT messages from conversations they are part of.
CREATE POLICY "Users can read their own messages"
ON public.messages
FOR SELECT
USING (public.is_conversation_participant(conversation_id));


-- Policy: Allow users to INSERT messages into conversations they are part of.
CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT
WITH CHECK (public.is_conversation_participant(conversation_id) AND (sender_id = auth.uid()));


-- Function: Get the count of unread messages for the currently authenticated user.
-- This function will operate under the RLS policies defined above.
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer AS $$
DECLARE
    unread_count integer;
BEGIN
    SELECT count(*)
    INTO unread_count
    FROM public.messages
    WHERE recipient_id = auth.uid() AND is_read = false;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
