
-- This function will find an existing conversation between two users
-- or create a new one if it doesn't exist.

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_participant_one_id uuid,
  p_participant_two_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Check if a conversation between these two users already exists
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE
    cp1.user_id = p_participant_one_id AND cp2.user_id = p_participant_two_id;

  -- If a conversation is found, return its ID
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- If no conversation is found, create a new one
  INSERT INTO conversations (id) VALUES (gen_random_uuid())
  RETURNING id INTO v_conversation_id;

  -- Add both participants to the conversation_participants table
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, p_participant_one_id);
  
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, p_participant_two_id);

  RETURN v_conversation_id;
END;
$$;
