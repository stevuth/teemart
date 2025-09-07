-- Function to check if a user is a participant in a conversation
create or replace function is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean as $$
declare
  is_participant boolean;
begin
  select exists (
    select 1
    from conversations
    where id = p_conversation_id
      and (participant_one_id = p_user_id or participant_two_id = p_user_id)
  ) into is_participant;
  return is_participant;
end;
$$ language plpgsql security definer;

-- Grant execute permission to the authenticated role
grant execute on function is_conversation_participant(uuid, uuid) to authenticated;

-- Update RLS policy for inserting messages
drop policy if exists "Allow insert for conversation participants" on public.messages;
create policy "Allow insert for conversation participants"
on public.messages for insert
with check (
  (auth.uid() = sender_id) AND
  is_conversation_participant(conversation_id, auth.uid())
);
