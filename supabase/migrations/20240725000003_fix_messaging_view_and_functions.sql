-- Drop the faulty view and functions if they exist to prevent errors on re-run
DROP FUNCTION IF EXISTS get_unread_message_count();
DROP FUNCTION IF EXISTS get_user_conversations_new(uuid);
DROP VIEW IF EXISTS conversation_participants;


-- Re-create the conversation_participants view correctly.
-- This assumes you have a join table named 'conversation_users' with 'conversation_id' and 'user_id' columns.
-- This is a more standard and scalable design than using an array.
CREATE OR REPLACE VIEW public.conversation_participants AS
SELECT
  cu.conversation_id,
  cu.user_id
FROM
  public.conversation_users cu;


-- Re-create the function to get the unread message count for the logged-in user.
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count integer;
BEGIN
  -- Ensure the function is called by an authenticated user
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT count(*)::integer
  INTO unread_count
  FROM public.messages
  WHERE recipient_id = auth.uid() AND is_read = false;

  RETURN unread_count;
END;
$$;


-- Re-create the function to get a user's conversation list, using the corrected view.
CREATE OR REPLACE FUNCTION public.get_user_conversations_new(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  last_message_at timestamptz,
  last_message_content text,
  last_message_sender_id uuid,
  other_participant jsonb,
  unread_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_convos AS (
    SELECT cp.conversation_id
    FROM public.conversation_participants cp
    WHERE cp.user_id = p_user_id
  ),
  last_messages AS (
    SELECT
      m.conversation_id,
      m.created_at as last_message_at,
      m.content as last_message_content,
      m.sender_id as last_message_sender_id,
      ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
    FROM public.messages m
    WHERE m.conversation_id IN (SELECT conversation_id FROM user_convos)
  )
  SELECT
    c.id,
    c.created_at,
    lm.last_message_at,
    lm.last_message_content,
    lm.last_message_sender_id,
    (
      SELECT jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
      FROM public.profiles p
      WHERE p.id = (
        SELECT user_id FROM public.conversation_participants cp_other
        WHERE cp_other.conversation_id = c.id AND cp_other.user_id <> p_user_id
        LIMIT 1
      )
    ) as other_participant,
    (
      SELECT count(*)::int FROM public.messages m_unread
      WHERE m_unread.conversation_id = c.id
      AND m_unread.recipient_id = p_user_id
      AND m_unread.is_read = false
    ) as unread_count
  FROM public.conversations c
  LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
  WHERE c.id IN (SELECT conversation_id FROM user_convos)
  ORDER BY lm.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$;