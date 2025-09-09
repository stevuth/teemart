
-- Drop the existing incorrect function
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid, uuid);

-- Recreate the function with the correct INSERT statement
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_participant_one_id uuid,
    p_participant_two_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Check if a conversation between these two participants already exists
    SELECT cp1.conversation_id INTO v_conversation_id
    FROM conversation_participants AS cp1
    JOIN conversation_participants AS cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE
        (cp1.user_id = p_participant_one_id AND cp2.user_id = p_participant_two_id)
        OR (cp1.user_id = p_participant_two_id AND cp2.user_id = p_participant_one_id)
    LIMIT 1;

    -- If a conversation is found, return its ID
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- If no conversation is found, create a new one, now including the participant IDs.
    -- This is the corrected part.
    INSERT INTO public.conversations (participant_one_id, participant_two_id)
    VALUES (p_participant_one_id, p_participant_two_id)
    RETURNING id INTO v_conversation_id;

    -- Add both participants to the conversation_participants join table for efficient lookups
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);

    -- Return the ID of the new conversation
    RETURN v_conversation_id;

EXCEPTION
    WHEN unique_violation THEN
        -- In case of a race condition where two users create a conversation simultaneously,
        -- re-query to find the existing conversation.
        SELECT cp1.conversation_id INTO v_conversation_id
        FROM conversation_participants AS cp1
        JOIN conversation_participants AS cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE
            (cp1.user_id = p_participant_one_id AND cp2.user_id = p_participant_two_id)
            OR (cp1.user_id = p_participant_two_id AND cp2.user_id = p_participant_one_id)
        LIMIT 1;
        RETURN v_conversation_id;
END;
$$;
