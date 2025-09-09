
-- This function is called when a user tries to start a chat.
-- It checks if a conversation between the two users already exists.
-- If it does, it returns the existing conversation's ID.
-- If not, it creates a new conversation and returns the new ID.
-- This version corrects the logic to be compatible with RLS policies.
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_participant_one_id uuid,
    p_participant_two_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
-- SECURITY DEFINER is crucial; it allows the function to run with elevated privileges
-- to create the conversation row, which the user's RLS policy might otherwise block on INSERT.
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Check if a conversation between these two participants already exists
    -- This query works because the SELECT RLS policy allows users to see conversations
    -- they are a part of.
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE
        (participant_one_id = p_participant_one_id AND participant_two_id = p_participant_two_id) OR
        (participant_one_id = p_participant_two_id AND participant_two_id = p_participant_one_id)
    LIMIT 1;

    -- If a conversation is found, return its ID
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- If no conversation is found, create a new one.
    -- The SECURITY DEFINER role allows this INSERT to bypass the user's restrictive INSERT RLS policy.
    INSERT INTO public.conversations (participant_one_id, participant_two_id)
    VALUES (p_participant_one_id, p_participant_two_id)
    RETURNING id INTO v_conversation_id;
    
    -- Add participants to the conversation_participants table
    INSERT into public.conversation_participants(conversation_id, user_id)
    VALUES (v_conversation_id, p_participant_one_id), (v_conversation_id, p_participant_two_id);

    -- Return the ID of the new conversation
    RETURN v_conversation_id;

END;
$$;
