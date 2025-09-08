-- This function first checks if a conversation already exists between two users.
-- If not, it creates a new conversation, correctly inserting the participant IDs to satisfy the database constraints.
-- This version adds permission handling to work with RLS policies.
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
    -- Set the role to service_role to bypass RLS for this operation
    -- This is critical for SECURITY DEFINER functions that write to RLS-protected tables
    PERFORM set_config('role', 'service_role', true);

    -- Check if a conversation between these two participants already exists
    SELECT c.id INTO v_conversation_id
    FROM public.conversations as c
    WHERE
        (c.participant_one_id = p_participant_one_id AND c.participant_two_id = p_participant_two_id)
        OR (c.participant_one_id = p_participant_two_id AND c.participant_two_id = p_participant_one_id)
    LIMIT 1;

    -- If a conversation is found, return its ID
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- If no conversation is found, create a new one, providing the participant IDs.
    INSERT INTO public.conversations (participant_one_id, participant_two_id)
    VALUES (p_participant_one_id, p_participant_two_id)
    RETURNING id INTO v_conversation_id;

    -- Return the ID of the new conversation
    RETURN v_conversation_id;

END;
$$;
