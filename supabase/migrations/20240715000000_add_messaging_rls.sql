-- Enable RLS for the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own conversations' messages
CREATE POLICY "Allow individual read access on messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Policy: Allow users to send messages in their own conversations
CREATE POLICY "Allow individual insert access on messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- Policy: Allow users to view images in their conversations
CREATE POLICY "Allow read access to images in user conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-images' AND
  (storage.owner_id(owner) = auth.uid() OR
   EXISTS (
     SELECT 1 FROM public.messages
     WHERE
       messages.image_url LIKE '%' || objects.name AND
       (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
   ))
);

-- Policy: Allow users to upload images to chat
CREATE POLICY "Allow insert access for chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' AND
  storage.owner_id(owner) = auth.uid()
);
