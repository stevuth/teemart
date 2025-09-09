
-- Drop all potentially conflicting old policies and triggers first for a clean slate.
DROP POLICY IF EXISTS "Allow insert for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow read for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for conversation participants" ON public.messages;
DROP TRIGGER IF EXISTS on_new_message ON public.messages;

-- Function to check if a user is part of a conversation
create or replace function is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from conversation_participants
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
end;
$$;

-- RLS Policy: Allow participants to READ messages in their conversation
CREATE POLICY "Allow read access for conversation participants"
ON public.messages
FOR SELECT
USING (
  is_conversation_participant(conversation_id, auth.uid())
);

-- RLS Policy: Allow participants to INSERT messages into their conversation
CREATE POLICY "Allow insert access for conversation participants"
ON public.messages
FOR INSERT
WITH CHECK (
  is_conversation_participant(conversation_id, auth.uid()) AND (sender_id = auth.uid())
);

-- Ensure RLS is enabled on the table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
