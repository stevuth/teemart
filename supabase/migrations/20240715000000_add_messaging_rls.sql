
-- Enable RLS on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow read for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Allow read access to images in user conversations" ON storage.objects;

-- Allow users to insert messages into their own conversations
CREATE POLICY "Allow insert for conversation participants"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())))
);

-- Allow users to read messages from their own conversations
CREATE POLICY "Allow read for conversation participants"
ON public.messages
FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (participant_one_id = auth.uid() OR participant_two_id = auth.uid())))
);

-- Allow users to upload images to the chat-images bucket
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-images' AND owner_id = auth.uid() );


-- Policy: Allow users to view images in their conversations
CREATE POLICY "Allow read access to images in user conversations"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (
    EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.conversations c ON m.conversation_id = c.id
        WHERE m.image_url LIKE '%' || storage.objects.name AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  )
);
