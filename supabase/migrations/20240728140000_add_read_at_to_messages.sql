-- Add the missing read_at column to the messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Drop existing functions and their dependent objects (like RLS policies) to ensure a clean slate
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_unread_message_count() CASCADE;
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_conversations(uuid) CASCADE;
DROP FUNCTION IF EXISTS mark_conversation_as_read(uuid) CASCADE;


-- Helper function to check if a user is part of a conversation.
-- This runs with elevated permissions to securely check the participants table.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
  );
END;
$$;


-- First, enable Row Level Security on the messages table if it's not already.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before creating new ones
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- 1. RLS Policy for SELECT: Users can only read messages from conversations they are a part of.
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (is_conversation_participant(conversation_id, auth.uid()));

-- 2. RLS Policy for INSERT: Users can only send messages into conversations they are a part of.
CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (is_conversation_participant(conversation_id, auth.uid()));


-- Database function to get the count of unread messages for the current user.
-- This function is secure because it will automatically be filtered by the RLS policy above.
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


-- Database function to get an existing conversation or create a new one.
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_participant_one_id uuid, p_participant_two_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Try to find an existing conversation between the two participants
    SELECT cp1.conversation_id INTO v_conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = p_participant_one_id AND cp2.user_id = p_participant_two_id;

    -- If no conversation is found, create a new one
    IF v_conversation_id IS NULL THEN
        -- Create the conversation
        INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;

        -- Add both participants to the conversation
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);
    END IF;

    RETURN v_conversation_id;
END;
$$;


-- Database function to fetch all conversations for a user with details.
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
        SELECT
            m.conversation_id,
            m.created_at,
            m.content,
            m.sender_id,
            m.image_url,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE cp.user_id = p_user_id
    )
    SELECT
        c.id,
        lm.created_at AS last_message_at,
        CASE
            WHEN lm.image_url IS NOT NULL AND lm.content IS NOT NULL AND lm.content <> '' THEN 'Photo: ' || lm.content
            WHEN lm.image_url IS NOT NULL THEN 'Photo'
            ELSE lm.content
        END AS last_message_content,
        lm.sender_id AS last_message_sender_id,
        (SELECT COUNT(*) FROM messages m_count WHERE m_count.conversation_id = c.id AND m_count.recipient_id = p_user_id AND m_count.read_at IS NULL) AS unread_count,
        jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS other_participant
    FROM conversations c
    JOIN conversation_participants cp_me ON c.id = cp_me.conversation_id AND cp_me.user_id = p_user_id
    JOIN conversation_participants cp_other ON c.id = cp_other.conversation_id AND cp_other.user_id <> p_user_id
    JOIN profiles p ON cp_other.user_id = p.id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    ORDER BY lm.created_at DESC NULLS LAST;
END;
$$;

-- Mark conversations as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND recipient_id = auth.uid()
    AND read_at IS NULL;
$$;
