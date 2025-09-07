-- Enable HTTP extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing policies and functions if they exist to ensure a clean slate.
-- We use "IF EXISTS" to prevent errors if they were already removed.
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "public"."messages";
DROP POLICY IF EXISTS "Allow insert for conversation participants" ON "public"."messages";
DROP POLICY IF EXISTS "Allow select for conversation participants" ON "public"."messages";
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid);
DROP FUNCTION IF EXISTS handle_new_message();

-- Function to check if a user is a participant in a conversation
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Allow users to view messages in conversations they are part of.
CREATE POLICY "Allow select for conversation participants"
ON "public"."messages"
FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

-- RLS Policy: Allow users to insert messages into conversations they are part of.
CREATE POLICY "Allow insert for conversation participants"
ON "public"."messages"
FOR INSERT
WITH CHECK ((auth.uid() = sender_id) AND is_conversation_participant(conversation_id, auth.uid()));

-- Function to trigger push notification on new message
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_profile RECORD;
  notification_payload JSON;
BEGIN
  -- Get recipient's profile to check for FCM tokens
  SELECT * INTO recipient_profile FROM profiles WHERE id = NEW.recipient_id;

  -- Proceed only if recipient has FCM tokens
  IF recipient_profile.fcm_tokens IS NOT NULL AND jsonb_array_length(recipient_profile.fcm_tokens::jsonb) > 0 THEN
    -- Construct the payload for the push notification function
    notification_payload := json_build_object(
      'recipient_id', NEW.recipient_id,
      'title', (SELECT full_name FROM profiles WHERE id = NEW.sender_id),
      'body', NEW.content,
      'url', '/messages?conversationId=' || NEW.conversation_id
    );

    -- Use a BEGIN/EXCEPTION block to handle potential errors from http_post
    -- This ensures that a failure in sending the notification does not prevent the message from being saved.
    BEGIN
      -- Call the Supabase Edge Function to send the push notification
      PERFORM http_post(
        -- The URL of your deployed Edge Function
        'https://femgftishdtzacfimkpw.supabase.co/functions/v1/send-push-notification',
        notification_payload::TEXT,
        'application/json',
        -- Pass service_role_key for authorization
        ('{"Authorization": "Bearer ' || secrets.get('service_role_key') || '"}')::http_header[]
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error to the PostgreSQL logs but do not re-throw it
        RAISE WARNING 'Failed to send push notification for message_id %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_new_message_trigger ON public.messages;

-- Create the trigger that calls the function after a new message is inserted
CREATE TRIGGER on_new_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION handle_new_message();
