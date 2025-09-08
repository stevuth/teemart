
-- This SQL script corrects the database function responsible for creating chat conversations.
-- The previous version failed to provide participant IDs, causing a "not-null constraint" error.
-- This new version ensures that when a new conversation is created, the IDs of both
-- participants are correctly inserted, resolving the error and allowing the messaging feature to work.

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
    v_ordered_participant_one uuid;
    v_ordered_participant_two uuid;
BEGIN
    -- To prevent duplicate conversations (e.g., A-B and B-A), we order the participant IDs.
    IF p_participant_one_id < p_participant_two_id THEN
        v_ordered_participant_one := p_participant_one_id;
        v_ordered_participant_two := p_participant_two_id;
    ELSE
        v_ordered_participant_one := p_participant_two_id;
        v_ordered_participant_two := p_participant_one_id;
    END IF;

    -- Check if a conversation with this ordered pair of participants already exists.
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE participant_one_id = v_ordered_participant_one
      AND participant_two_id = v_ordered_participant_two;

    -- If a conversation is found, return its ID.
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- If no conversation is found, create a new one, providing the participant IDs.
    -- This is the corrected INSERT statement that fixes the "not-null constraint" error.
    INSERT INTO public.conversations (participant_one_id, participant_two_id)
    VALUES (v_ordered_participant_one, v_ordered_participant_two)
    RETURNING id INTO v_conversation_id;

    -- The trigger on the `conversations` table should automatically populate the `conversation_participants` table.
    -- No manual insertion is needed here if the trigger is set up correctly.

    -- Return the ID of the newly created or existing conversation.
    RETURN v_conversation_id;
END;
$$;
