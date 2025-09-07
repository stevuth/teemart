-- supabase/migrations/20240521120000_add_messaging_participant_check.sql

-- Helper function to check if a user is a participant in a conversation
create or replace function is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from conversations
    where id = p_conversation_id
      and (participant_one_id = p_user_id or participant_two_id = p_user_id)
  );
end;
$$;


-- Drop the old, incorrect policy first to avoid conflicts.
-- The name must match exactly. The original policy was named "Allow insert for authenticated users".
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.messages;


-- Create the new, correct policy.
-- This policy allows a user to insert a message if they are the sender AND a participant of the conversation.
CREATE POLICY "Allow insert for conversation participants"
ON public.messages
FOR INSERT
WITH CHECK (
  (auth.uid() = sender_id) AND
  (is_conversation_participant(conversation_id, sender_id))
);
