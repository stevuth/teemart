
ALTER TABLE public.products
ALTER COLUMN image_url TYPE text[] USING array[image_url];
