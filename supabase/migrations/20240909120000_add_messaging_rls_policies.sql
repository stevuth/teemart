-- Enable RLS on the tables if not already enabled.
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, ensuring a clean setup.
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations they are a part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;


-- Policies for the 'conversations' table

-- 1. SELECT Policy: Users can see conversations they are a participant in.
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (
  auth.uid() = participant_one_id OR auth.uid() = participant_two_id
);

-- 2. INSERT Policy: A user can create a new conversation if they are one of the participants.
CREATE POLICY "Users can create conversations they are a part of"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = participant_one_id OR auth.uid() = participant_two_id
);


-- Policies for the 'messages' table

-- Helper function to check if a user is part of a conversation.
-- This is more efficient than a complex subquery inside the policy.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = p_conversation_id
      AND (participant_one_id = p_user_id OR participant_two_id = p_user_id)
  );
$$;

-- 1. SELECT Policy: Users can only see messages from conversations they are a part of.
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  is_conversation_participant(conversation_id, auth.uid())
);

-- 2. INSERT Policy: A user can only send a message if they are the sender and are part of the conversation.
CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND is_conversation_participant(conversation_id, auth.uid())
);
