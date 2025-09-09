-- Drop existing RLS policies on messages to ensure a clean state.
DROP POLICY IF EXISTS "Allow insert for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow read for conversation participants" ON public.messages;

-- A helper function to check if a user is part of a conversation.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICY: Allow users to read messages in conversations they are a part of.
CREATE POLICY "Allow read for conversation participants"
ON public.messages
FOR SELECT USING (
  is_conversation_participant(conversation_id, auth.uid())
);

-- POLICY: Allow users to insert messages into conversations they are a part of.
-- This is the key policy that fixes the sending issue.
CREATE POLICY "Allow insert for conversation participants"
ON public.messages
FOR INSERT WITH CHECK (
  is_conversation_participant(conversation_id, auth.uid()) AND sender_id = auth.uid()
);
