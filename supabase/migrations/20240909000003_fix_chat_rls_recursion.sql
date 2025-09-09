
-- Drop the old, faulty policy that causes infinite recursion.
DROP POLICY IF EXISTS "Users can view participants of their own conversations." ON public.conversation_participants;

-- Recreate the policy with the correct, non-recursive logic.
-- This policy allows a user to see all participant records for a conversation
-- if and only if they are one of the two participants listed in the 'conversations' table row.
-- This breaks the recursive loop and resolves the error.
CREATE POLICY "Users can view participants of their own conversations."
ON public.conversation_participants
FOR SELECT
USING (
  exists (
    select 1
    from public.conversations
    where
      conversations.id = conversation_participants.conversation_id
      and (
        conversations.participant_one_id = auth.uid() OR
        conversations.participant_two_id = auth.uid()
      )
  )
);
