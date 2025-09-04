
'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/utils/supabase/server';

/**
 * Uploads images to Supabase storage using a service role key to bypass RLS policies.
 * @param formData - The FormData object containing the files to upload.
 * @returns An object with either an array of public URLs or an error message.
 */
export async function uploadImagesAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to upload images.' };
  }

  const files = formData.getAll('images') as File[];

  if (files.length === 0) {
    return { error: 'No files were provided for upload.' };
  }

  // Use the service role key here to create a client with admin privileges.
  // This client will bypass any RLS policies on the storage bucket.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const uploadPromises = files.map(file => {
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    return supabaseAdmin.storage.from('product-images').upload(fileName, file);
  });

  const uploadResults = await Promise.all(uploadPromises);

  const urls: string[] = [];
  for (const result of uploadResults) {
    if (result.error) {
      console.error('Upload Error:', result.error);
      return { error: `Failed to upload one or more images: ${result.error.message}` };
    }
    const { data: { publicUrl } } = supabaseAdmin.storage.from('product-images').getPublicUrl(result.data.path);
    urls.push(publicUrl);
  }

  return { urls };
}
