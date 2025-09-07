-- Drop the old, incorrect policy if it exists.
-- The name "Allow authenticated user to insert" is based on the original default policy.
DROP POLICY IF EXISTS "Allow authenticated user to insert" ON public.messages;
DROP POLICY IF EXISTS "Allow insert for conversation participants" ON public.messages;


-- Create a function to check if a user is a participant in a conversation.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = p_conversation_id
      AND (participant_one_id = p_user_id OR participant_two_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create the new, correct policy for inserting messages.
-- A user can only insert a message if they are the sender AND a participant in the conversation.
CREATE POLICY "Allow insert for conversation participants"
ON public.messages
FOR INSERT
WITH CHECK (
  (auth.uid() = sender_id) AND
  (is_conversation_participant(conversation_id, sender_id))
);
