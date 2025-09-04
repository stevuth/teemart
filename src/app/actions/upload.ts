
'use server';

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

  // Use the standard authenticated client which respects RLS policies.
  // The user's session from cookies allows this to work.
  const uploadPromises = files.map(file => {
    // The file path format MUST match the RLS policy.
    // e.g., <user_id>/<timestamp>-<filename>
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    return supabase.storage.from('product-images').upload(fileName, file);
  });

  const uploadResults = await Promise.all(uploadPromises);

  const urls: string[] = [];
  for (const result of uploadResults) {
    if (result.error) {
      console.error('Upload Error:', result.error);
      // Return the specific error from Supabase
      return { error: result.error.message };
    }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(result.data.path);
    urls.push(publicUrl);
  }

  return { urls };
}
