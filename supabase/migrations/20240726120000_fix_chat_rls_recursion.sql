-- Fix for infinite recursion error on conversation_participants RLS policy.

-- Step 1: Drop all existing (and faulty) policies on the table to ensure a clean state.
DROP POLICY IF EXISTS "Users can view participants of their own conversations." ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation records." ON public.conversation_participants;


-- Step 2: Create the new, non-recursive policy.
-- This policy correctly validates access by checking the parent `conversations` table
-- to see if the current user is a participant, which avoids the recursion error.
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
