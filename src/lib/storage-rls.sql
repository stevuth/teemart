-- POLICIES FOR 'product-images' BUCKET

-- 1. Drop existing policies to start fresh and avoid conflicts.
DROP POLICY IF EXISTS "Allow authenticated users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;


-- 2. Allow authenticated (logged-in) users to upload images.
-- This policy is more robust. It checks that the user's ID is at the beginning
-- of the file path, which is more flexible than checking for an exact folder name.
-- This prevents errors if filenames contain special characters or subdirectories are used.
CREATE POLICY "Allow authenticated users to upload to their own folder"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-images' AND path_tokens[1] = auth.uid()::text
);


-- 3. Allow public read access so anyone can see the product images.
-- This is necessary for the images to display in your application for all visitors.
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );
