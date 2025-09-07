
-- Enable HTTP extension for Supabase Edge Functions (if needed elsewhere)
create extension if not exists http with schema extensions;
-- Enable pg_net for direct network access from PostgreSQL
create extension if not exists pg_net with schema extensions;

-- Clean up any previous, potentially conflicting policies and functions
drop policy if exists "Allow insert for authenticated users" on "public"."messages";
drop policy if exists "Allow insert for conversation participants" on "public"."messages";
drop function if exists is_conversation_participant(uuid, uuid);

-- Function to check if a user is part of a conversation
create or replace function is_conversation_participant(p_user_id uuid, p_conversation_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from conversation_participants
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
end;
$$ language plpgsql security definer;

-- RLS Policy: Allow users to insert messages only into conversations they are part of.
create policy "Allow insert for conversation participants"
on "public"."messages"
for insert with check (
  (auth.uid() = sender_id) and
  is_conversation_participant(auth.uid(), conversation_id)
);


-- Completely remove the trigger and function related to push notifications.
-- This is the key fix to prevent the messaging error.
drop trigger if exists on_new_message on public.messages;
drop function if exists public.handle_new_message();
