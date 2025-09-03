-- POLICIES FOR 'product-images' BUCKET

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;


-- 2. Allow authenticated users to upload images into a folder matching their user ID.
-- This is the crucial policy that fixes the error. It checks that the user's ID
-- from their session (auth.uid()) matches the first part of the path they are
-- trying to upload to (e.g., 'user-id-123/image.png').
CREATE POLICY "Allow authenticated users to upload to their own folder"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text
);


-- 3. Allow public read access so anyone can see the product images.
-- This is necessary for the images to display in your application for all visitors.
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );
