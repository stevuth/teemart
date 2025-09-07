
-- Enable the http extension
create extension if not exists http with schema extensions;

-- Function to check if a user is a participant in a conversation
create or replace function is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from conversation_participants
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
$$;

-- RLS Policy for selecting messages
drop policy if exists "Allow select for conversation participants" on public.messages;
create policy "Allow select for conversation participants"
on public.messages for select
using (
  is_conversation_participant(conversation_id, auth.uid())
);

-- RLS Policy for inserting messages
drop policy if exists "Allow insert for conversation participants" on public.messages;
create policy "Allow insert for conversation participants"
on public.messages for insert
with check (
  auth.uid() = sender_id and
  is_conversation_participant(conversation_id, auth.uid())
);

-- Function to get or create a conversation
create or replace function get_or_create_conversation(
  p_participant_one_id uuid,
  p_participant_two_id uuid
)
returns uuid
language plpgsql
as $$
declare
  v_conversation_id uuid;
begin
  -- Check if a conversation already exists
  select cp1.conversation_id into v_conversation_id
  from conversation_participants cp1
  join conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  where
    cp1.user_id = p_participant_one_id and
    cp2.user_id = p_participant_two_id;

  -- If not, create a new one
  if v_conversation_id is null then
    insert into conversations default values returning id into v_conversation_id;
    
    -- IMPORTANT: Insert both participants into the participants table
    insert into conversation_participants (conversation_id, user_id)
    values (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);
  end if;

  return v_conversation_id;
end;
$$;

-- Function to handle push notifications on new messages
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  -- Get sender's name
  select full_name into sender_name from public.profiles where id = new.sender_id;

  -- Use a BEGIN/EXCEPTION block to gracefully handle potential errors
  begin
    perform net.http_post(
      url:='https://femgftishdtzacfimkpw.supabase.co/functions/v1/send-push-notification',
      headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbWdmdGlzaGR0emFjZmlta3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTM1NTg2MiwiZXhwIjoyMDM2OTMxODYyfQ.29z_OQCANt02zIs3z4fH8Z7hALnQJ4vWn15vVfP-O6E", "Content-Type": "application/json"}',
      body:=jsonb_build_object(
        'recipient_id', new.recipient_id,
        'title', sender_name,
        'body', new.content,
        'url', '/messages?conversationId=' || new.conversation_id::text
      )
    );
  exception
    when others then
      -- Log the error to the database logs but do not re-throw it
      raise warning 'Push notification failed for message %: %', new.id, SQLERRM;
  end;

  return new;
end;
$$;

-- Trigger to call the function after a new message is inserted
drop trigger if exists on_new_message_send_notification on public.messages;
create trigger on_new_message_send_notification
after insert on public.messages
for each row
execute function public.handle_new_message();

