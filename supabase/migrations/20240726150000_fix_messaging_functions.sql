
-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS get_user_conversations(uuid);

-- Create a view to easily access conversation participants
CREATE OR REPLACE VIEW "public"."conversation_participants" AS
SELECT
  "m"."conversation_id",
  "m"."sender_id" AS "participant_id"
FROM
  "public"."messages" "m"
UNION
SELECT
  "m"."conversation_id",
  "m"."recipient_id" AS "participant_id"
FROM
  "public"."messages" "m";

-- A more robust function to get all conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations_new(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    last_message_at timestamptz,
    last_message_content text,
    last_message_sender_id uuid,
    unread_count bigint,
    other_participant json
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT
            m.*,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.sender_id = p_user_id OR m.recipient_id = p_user_id
    ),
    last_messages AS (
        SELECT *
        FROM ranked_messages
        WHERE rn = 1
    )
    SELECT
        lm.conversation_id AS id,
        lm.created_at AS last_message_at,
        lm.content AS last_message_content,
        lm.sender_id AS last_message_sender_id,
        (
            SELECT COUNT(*)
            FROM messages msg
            WHERE msg.conversation_id = lm.conversation_id
            AND msg.recipient_id = p_user_id
            AND msg.is_read = false
        ) AS unread_count,
        json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS other_participant
    FROM
        last_messages lm
    JOIN
        conversation_participants cp ON lm.conversation_id = cp.conversation_id AND cp.participant_id <> p_user_id
    JOIN
        profiles p ON cp.participant_id = p.id
    ORDER BY
        lm.created_at DESC;
END;
$$;


-- Corrected function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  select count(*)::int
  from messages
  where recipient_id = auth.uid() and is_read = false;
$$;

-- Mark a conversation's messages as read by the current user
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
  AND recipient_id = auth.uid();
$$;

-- A function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_participant_one_id uuid, p_participant_two_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Check for an existing conversation
    SELECT conversation_id INTO v_conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE
        cp1.participant_id = p_participant_one_id
        AND cp2.participant_id = p_participant_two_id
    LIMIT 1;

    -- If no conversation exists, create a new one
    IF v_conversation_id IS NULL THEN
        v_conversation_id := gen_random_uuid();
        -- Note: A message is not created here, so the conversation
        -- will only formally exist in the `messages` table once a message is sent.
        -- This is okay, as the UI flow will send a message right after getting the ID.
    END IF;

    RETURN v_conversation_id;
END;
$$;
