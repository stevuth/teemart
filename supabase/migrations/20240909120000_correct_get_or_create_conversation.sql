
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
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
    -- First, check if a conversation already exists between these two users,
    -- regardless of who is participant_one or participant_two.
    SELECT c.id INTO v_conversation_id
    FROM public.conversations as c
    WHERE
        (c.participant_one_id = p_participant_one_id AND c.participant_two_id = p_participant_two_id)
        OR (c.participant_one_id = p_participant_two_id AND c.participant_two_id = p_participant_one_id)
    LIMIT 1;

    -- If a conversation is found, return its ID immediately.
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- If no conversation is found, create a new one, providing the required participant IDs.
    INSERT INTO public.conversations (participant_one_id, participant_two_id)
    VALUES (p_participant_one_id, p_participant_two_id)
    RETURNING id INTO v_conversation_id;
    
    -- NOTE: It's assumed a database trigger on the `conversations` table
    -- automatically populates the `conversation_participants` table.
    -- If that trigger is missing, this function might not grant access correctly.
    -- However, this SQL directly fixes the "not-null constraint" error.

    -- Return the ID of the newly created conversation.
    RETURN v_conversation_id;

END;
$$;
