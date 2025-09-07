-- Enable the http extension if it doesn't exist
create extension if not exists http with schema extensions;

-- Create the function to check conversation participation
create or replace function is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
end;
$$;

-- RLS Policy for selecting messages
drop policy if exists "Allow read for conversation participants" on public.messages;
create policy "Allow read for conversation participants"
on public.messages for select
using (is_conversation_participant(conversation_id, auth.uid()));

-- RLS Policy for inserting messages
drop policy if exists "Allow insert for conversation participants" on public.messages;
create policy "Allow insert for conversation participants"
on public.messages for insert
with check (
  sender_id = auth.uid() and
  is_conversation_participant(conversation_id, auth.uid())
);

-- Function to get or create a conversation and ensure participants are added
create or replace function get_or_create_conversation(p_participant_one_id uuid, p_participant_two_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_conversation_id uuid;
begin
  -- Check for an existing conversation
  select c.id into v_conversation_id
  from conversations c
  join conversation_participants cp1 on c.id = cp1.conversation_id
  join conversation_participants cp2 on c.id = cp2.conversation_id
  where cp1.user_id = p_participant_one_id and cp2.user_id = p_participant_two_id;

  -- If no conversation is found, create one
  if v_conversation_id is null then
    insert into conversations default values
    returning id into v_conversation_id;

    -- Add both participants to the new conversation
    insert into conversation_participants (conversation_id, user_id)
    values (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);
  end if;

  return v_conversation_id;
end;
$$;


-- Robust function to handle new messages and send notifications
create or replace function handle_new_message()
returns trigger
language plpgsql
security definer -- Important for calling other functions
as $$
declare
  recipient_profile record;
  notification_payload json;
  notification_url text;
begin
  -- Update the last_message_at timestamp on the conversation
  update conversations
  set last_message_at = now()
  where id = new.conversation_id;

  -- Get recipient's profile for notification
  select fcm_tokens into recipient_profile
  from profiles
  where id = new.recipient_id;

  -- Only proceed if the recipient has FCM tokens
  if recipient_profile is not null and array_length(recipient_profile.fcm_tokens, 1) > 0 then
    -- Construct the notification payload
    notification_url := '/messages?conversationId=' || new.conversation_id;
    notification_payload := json_build_object(
      'recipient_id', new.recipient_id,
      'title', (select full_name from profiles where id = new.sender_id),
      'body', new.content,
      'url', notification_url
    );

    -- Attempt to send the notification, but don't let it fail the transaction
    begin
      -- Call the Edge Function, ensuring the header is set correctly
      perform extensions.http_post(
          'https://femgftishdtzacfimkpw.supabase.co/functions/v1/send-push-notification',
          notification_payload,
          'application/json',
          ARRAY[('Authorization', 'Bearer ' || (select current_setting('request.jwt.claims', true)::jsonb ->> 'service_role_key'))::extensions.http_header]
      );
    exception when others then
      -- Log the error to the database logs but do not re-throw it
      raise warning 'Failed to send push notification for message %: %', new.id, SQLERRM;
    end;
  end if;

  return new;
end;
$$;

-- Drop the old trigger if it exists
drop trigger if exists on_new_message on public.messages;

-- Create the trigger to call the robust handler function
create trigger on_new_message
  after insert on public.messages
  for each row execute function handle_new_message();
