
-- Enable RLS for the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to see messages in conversations they are part of
CREATE POLICY "Allow read access to participants" ON public.messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Allow users to send messages
CREATE POLICY "Allow insert access for authenticated users" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Enable RLS for the chat-images storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to view images in conversations they are part of
CREATE POLICY "Allow read access to chat images for participants" ON storage.objects
FOR SELECT USING (
    bucket_id = 'chat-images' AND
    (get_chat_participant_from_path(name) = auth.uid())
);

-- Allow users to upload images to chats
CREATE POLICY "Allow insert for authenticated users to chat-images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.role() = 'authenticated'
);

-- Helper function to extract user ID from storage path
CREATE OR REPLACE FUNCTION get_chat_participant_from_path(path_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  user_id_text text;
BEGIN
  user_id_text := split_part(path_name, '/', 1);
  -- Handle potential errors if the text is not a valid UUID
  BEGIN
    RETURN user_id_text::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$;
