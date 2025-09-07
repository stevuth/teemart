-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "public"."messages";
DROP POLICY IF EXISTS "Allow insert for conversation participants" ON "public"."messages";
DROP POLICY IF EXISTS "Allow select for conversation participants" ON "public"."messages";

-- Drop existing function if it exists to replace it
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS public.handle_new_message();

-- Function to check if a user is part of a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id AND cp.user_id = p_user_id
  );
END;
$$;


-- Function to get or create a conversation and ensure participants are added
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_participant_one_id uuid,
  p_participant_two_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id uuid;
  v_sorted_participants uuid[];
BEGIN
  -- Sort participant IDs to ensure consistent conversation lookup
  SELECT array_agg(id ORDER BY id) INTO v_sorted_participants
  FROM (VALUES (p_participant_one_id), (p_participant_two_id)) AS t(id);
  
  -- Find existing conversation
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_sorted_participants[1]
    AND cp2.user_id = v_sorted_participants[2];

  -- If no conversation exists, create a new one
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;

    -- **CRITICAL FIX**: Insert both participants into the conversation_participants table
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- Create new policies with the correct logic
CREATE POLICY "Allow select for conversation participants"
ON "public"."messages"
FOR SELECT
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Allow insert for conversation participants"
ON "public"."messages"
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  public.is_conversation_participant(conversation_id, sender_id) AND
  public.is_conversation_participant(conversation_id, recipient_id)
);


-- Function to handle new messages and send notifications
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Important for calling the edge function with service role key
AS $$
DECLARE
  secret_value text;
BEGIN
  -- This function now only calls the edge function.
  -- Error handling is inside the Edge Function itself.
  -- The SECURITY DEFINER context is crucial for using secrets.
  
  -- Use pg_net to call the Edge Function.
  -- The 'handle_error' parameter makes the http request non-blocking and ignores errors.
  SELECT net.http_post(
    url:='https://femgftishdtzacfimkpw.supabase.co/functions/v1/send-push-notification',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || secrets.get('service_role_key') || '"}'::jsonb,
    body:=jsonb_build_object(
      'recipient_id', NEW.recipient_id,
      'title', (SELECT full_name FROM public.profiles WHERE id = NEW.sender_id),
      'body', NEW.content,
      'url', '/messages?conversationId=' || NEW.conversation_id
    ),
    handle_error := true
  ) INTO secret_value;

  RETURN NEW;
END;
$$;


-- Ensure the trigger is in place
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_message() TO authenticated;
