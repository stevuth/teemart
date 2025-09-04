-- =================================================================
-- RLS POLICIES FOR 'product-images' STORAGE BUCKET
-- =================================================================
-- Run this SQL code in your Supabase SQL Editor to fix storage permission errors.
-- Go to Supabase Dashboard > SQL Editor > New query.

-- 1. Clean up any old, potentially conflicting policies first.
--    This ensures a clean slate. It's safe to run these even if the policies don't exist.
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;


-- 2. Create INSERT policy for authenticated users.
--    This policy allows a logged-in user to upload files into a folder
--    that is named with their own User ID (uid).
--    The `storage.folder_name(name)` function extracts the folder path.
--    This is the key policy that fixes the "violates row-level security policy" error.
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-images' AND auth.uid() = (storage.folder_name(name))[1]::uuid
);


-- 3. Create SELECT policy for public access.
--    This policy allows anyone (including non-logged-in users) to view images.
--    This is required for the images to be displayed in your application.
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );



-- =================================================================
-- RLS POLICIES FOR 'products' DATABASE TABLE
-- =================================================================
-- These policies ensure users can only manage their own product listings.

-- 1. Enable Row Level Security on the products table.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Clean up old policies.
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to create products" ON public.products;
DROP POLICY IF EXISTS "Allow users to update their own products" ON public.products;
DROP POLICY IF EXISTS "Allow users to delete their own products" ON public.products;

-- 3. Create SELECT policy: Allow anyone to view all products.
CREATE POLICY "Allow public read access to products"
ON public.products FOR SELECT
USING (true);

-- 4. Create INSERT policy: Allow authenticated users to create their own products.
CREATE POLICY "Allow authenticated users to create products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Create UPDATE policy: Allow users to update only their own products.
CREATE POLICY "Allow users to update their own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create DELETE policy: Allow users to delete only their own products.
CREATE POLICY "Allow users to delete their own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
