
-- RLS Policy for 'public-verification-documents' bucket

-- 1. Allow authenticated users to upload their own documents
CREATE POLICY "Allow authenticated users to upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Allow authenticated users to view their own documents
CREATE POLICY "Allow authenticated users to view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'public-verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Allow admins to view any document for verification purposes
CREATE POLICY "Allow admins to view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'public-verification-documents'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);
