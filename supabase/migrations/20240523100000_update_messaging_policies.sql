
-- Drop the old insert policy if it exists by its original name
drop policy if exists "Allow insert for authenticated users" on "public"."messages";

-- Create a security definer function to check conversation participation
create or replace function is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from conversations
    where id = p_conversation_id and (participant_one_id = p_user_id or participant_two_id = p_user_id)
  );
$$;

-- Create the new, correct insert policy using the function
create policy "Allow insert for conversation participants"
on "public"."messages"
for insert
with check (
  (auth.uid() = sender_id) AND
  is_conversation_participant(conversation_id, sender_id)
);


-- Function to send a push notification when a new message is inserted
-- This version is updated to handle errors gracefully.
create or replace function handle_new_message()
returns trigger
language plpgsql
security definer -- Important for calling http_post as postgres user
as $$
declare
  -- Using the new secret name as expected by Supabase
  service_role_key text := secrets.get('SERVICE_ROLE_KEY');
  base_url text := secrets.get('SUPABASE_URL');
begin
  -- Non-blocking HTTP request to the Edge Function
  -- The `try...catch` block ensures that if the notification fails,
  -- the message insert transaction does not get rolled back.
  begin
    perform net.http_post(
      url := base_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'recipient_id', new.recipient_id,
        'title', (select raw_user_meta_data->>'full_name' from auth.users where id = new.sender_id),
        'body', new.content,
        'url', '/messages?conversationId=' || new.conversation_id
      )
    );
  exception
    when others then
      -- Log the error to the Postgres logs but do not re-throw it.
      -- This allows the message to be saved even if notifications fail.
      raise warning 'handle_new_message: Failed to send push notification. SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
  end;
  
  return new;
end;
$$;

-- Drop the existing trigger if it exists
drop trigger if exists on_new_message on public.messages;

-- Create the trigger that calls the function
create trigger on_new_message
  after insert on public.messages
  for each row execute procedure handle_new_message();

-- Enable HTTP extension if it's not already enabled
-- This runs safely if the extension is already present.
create extension if not exists http with schema "extensions";
-- Grant usage of the net schema to postgres role, which the function runs as.
grant usage on schema net to postgres;
