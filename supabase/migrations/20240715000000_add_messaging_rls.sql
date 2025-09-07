
-- Allow users to create and read conversations they are a part of
DROP POLICY IF EXISTS "Allow create access to own conversations" ON public.conversations;
CREATE POLICY "Allow create access to own conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

DROP POLICY IF EXISTS "Allow read access to own conversations" ON public.conversations;
CREATE POLICY "Allow read access to own conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Allow users to send and read messages in their conversations
DROP POLICY IF EXISTS "Allow insert access to own messages" ON public.messages;
CREATE POLICY "Allow insert access to own messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        exists(
            select 1 from conversations
            where id = messages.conversation_id
            and (conversations.participant_one_id = auth.uid() or conversations.participant_two_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Allow read access to own messages" ON public.messages;
CREATE POLICY "Allow read access to own messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        exists(
            select 1 from conversations
            where id = messages.conversation_id
            and (conversations.participant_one_id = auth.uid() or conversations.participant_two_id = auth.uid())
        )
    );

-- Policies for chat-images bucket in storage
-- Allow users to upload images to the chat-images bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload chat images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload chat images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK ( bucket_id = 'chat-images' AND owner_id = auth.uid() );

-- Allow users to read images from conversations they are part of
DROP POLICY IF EXISTS "Allow read access to images in user conversations" ON storage.objects;
CREATE POLICY "Allow read access to images in user conversations"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'chat-images' AND
        owner_id IN (
            SELECT p.id FROM public.profiles p JOIN public.conversations c ON (p.id = c.participant_one_id OR p.id = c.participant_two_id) WHERE c.id IN (
                SELECT m.conversation_id FROM public.messages m WHERE m.image_url LIKE '%' || storage.objects.name
            ) AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
        )
    );
