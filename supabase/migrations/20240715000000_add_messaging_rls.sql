
-- Drop existing policies if they exist, to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.conversations;

-- Drop the function if it exists, to recreate it.
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid);

-- 
-- RLS for conversations table
--
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
ON public.conversations
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (participant_one_id = auth.uid()) OR (participant_two_id = auth.uid())
);

--
-- Helper function to check if a user is part of a conversation
--
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = p_conversation_id
      AND (participant_one_id = p_user_id OR participant_two_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--
-- RLS for messages table
--
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (sender_id = auth.uid()) OR (recipient_id = auth.uid())
);

CREATE POLICY "Users can insert their own messages"
ON public.messages
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (sender_id = auth.uid()) AND (is_conversation_participant(conversation_id, auth.uid()))
);


--
-- RLS for Storage
--
-- Allow authenticated users to upload to 'chat-images'
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-images' AND auth.role() = 'authenticated' );

-- Allow users to view images in conversations they are part of
CREATE POLICY "Allow conversation participants to view images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-images'
    AND is_conversation_participant(
        (storage.foldername(name))[1]::uuid,
        auth.uid()
    )
);
