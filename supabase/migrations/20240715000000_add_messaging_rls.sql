
-- Enable RLS on the public messages table
alter table public.messages enable row level security;

-- Allow users to see their own messages
create policy "Users can view their own messages."
  on public.messages for select
  using ( auth.uid() = sender_id or auth.uid() = recipient_id );

-- Allow users to send messages
create policy "Users can insert their own messages."
  on public.messages for insert
  with check ( auth.uid() = sender_id );

-- POLICIES FOR STORAGE
-- In a real app, you would create these policies in the Supabase Dashboard
-- under Storage -> Policies. We add them here for reproducibility.

-- Create policy for users to upload to the 'chat-images' bucket
create policy "Users can upload chat images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'chat-images' AND auth.uid() = owner );

-- Create policy for users to view images in their conversations
create policy "Users can view images in their conversations"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-images' AND
    (
      auth.uid() IN (
        SELECT m.sender_id FROM public.messages m WHERE m.image_url LIKE '%' || storage.objects.name
      ) OR
      auth.uid() IN (
        SELECT m.recipient_id FROM public.messages m WHERE m.image_url LIKE '%' || storage.objects.name
      )
    )
  );

-- Create policy for users to delete their own chat images
create policy "Users can delete their own chat images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'chat-images' AND auth.uid() = owner );
