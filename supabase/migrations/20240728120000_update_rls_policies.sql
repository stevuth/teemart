
-- Enable RLS on the products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts before creating new ones
DROP POLICY IF EXISTS "Allow authenticated users to insert their own products" ON public.products;
DROP POLICY IF EXISTS "Allow users to update their own products" ON public.products;
DROP POLICY IF EXISTS "Allow users to delete their own products" ON public.products;
DROP POLICY IF EXISTS "Allow all users to view products" ON public.products;


-- RLS Policy for INSERT: Users can only insert products for themselves.
CREATE POLICY "Allow authenticated users to insert their own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy for UPDATE: Users can only update their own products.
CREATE POLICY "Allow users to update their own products"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy for DELETE: Users can only delete their own products.
CREATE POLICY "Allow users to delete their own products"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy for SELECT: All users (including anonymous) can view all products.
CREATE POLICY "Allow all users to view products"
ON public.products
FOR SELECT
TO public
USING (true);
