
-- Enable RLS on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read messages in their conversations
CREATE POLICY "Allow read access to own messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Allow users to send messages in their conversations
CREATE POLICY "Allow insert access to own messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
);

-- Enable RLS on the chat-images bucket objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload images to the 'chat-images' bucket
-- The owner column is text, so we must cast it to uuid to compare with auth.uid()
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.uid() = owner::uuid 
);

-- Allow authenticated users to read images from the 'chat-images' bucket
-- if they are a participant in the message that contains the image.
CREATE POLICY "Allow authenticated users to read chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    EXISTS (
        SELECT 1
        FROM public.messages
        WHERE
            messages.image_url LIKE '%' || storage.objects.name AND
            (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
);
