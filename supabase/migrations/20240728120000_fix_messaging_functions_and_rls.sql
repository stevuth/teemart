
-- Drop existing functions to ensure a clean slate and avoid conflicts.
-- The explicit type casting (::uuid) is necessary for the DROP command to find the correct function signature.
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid);
DROP FUNCTION IF EXISTS get_unread_message_count();
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_conversations(uuid);


-- Helper function to check if a user is part of a conversation.
-- SECURITY DEFINER allows it to check the conversation_participants table with elevated privileges,
-- bypassing RLS for this specific, secure check.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
  );
END;
$$;


-- Enable RLS on messages table if not already enabled.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure no conflicts.
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- RLS Policy for SELECT: Users can only read messages from conversations they are a part of.
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

-- RLS Policy for INSERT: Users can only send messages into conversations they are a part of.
CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (is_conversation_participant(conversation_id, auth.uid()));


-- Database function to securely get the unread message count for the current user.
-- The RLS policy automatically filters the rows this function can see.
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::int
  FROM public.messages
  WHERE recipient_id = auth.uid()
    AND read_at IS NULL;
$$;


-- Database function to find an existing conversation or create a new one.
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_participant_one_id uuid, p_participant_two_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Try to find an existing private conversation between the two participants
    SELECT cp1.conversation_id INTO v_conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = p_participant_one_id AND cp2.user_id = p_participant_two_id;

    -- If no conversation is found, create a new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;

        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);
    END IF;

    RETURN v_conversation_id;
END;
$$;


-- Database function to fetch all conversations for a user, including the last message and unread count.
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    last_message_at timestamptz,
    last_message_content text,
    last_message_sender_id uuid,
    unread_count bigint,
    other_participant jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        -- Efficiently get the last message for each conversation the user is in
        SELECT
            m.conversation_id,
            m.created_at,
            m.content,
            m.sender_id,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE cp.user_id = p_user_id
    )
    SELECT
        c.id,
        lm.created_at AS last_message_at,
        lm.content AS last_message_content,
        lm.sender_id AS last_message_sender_id,
        -- Subquery to count unread messages for the specific user in the conversation
        (SELECT COUNT(*) FROM public.messages m WHERE m.conversation_id = c.id AND m.recipient_id = p_user_id AND m.read_at IS NULL) AS unread_count,
        -- Build a JSON object for the other participant's details
        jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS other_participant
    FROM conversations c
    -- Join to find conversations the user is in
    JOIN conversation_participants cp_me ON c.id = cp_me.conversation_id AND cp_me.user_id = p_user_id
    -- Join again to find the other participant in that conversation
    JOIN conversation_participants cp_other ON c.id = cp_other.conversation_id AND cp_other.user_id <> p_user_id
    -- Join to get the other participant's profile details
    JOIN profiles p ON cp_other.user_id = p.id
    -- Left join to get the last message details
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    -- Order by the most recent message, with conversations without messages at the end
    ORDER BY lm.created_at DESC NULLS LAST;
END;
$$;
