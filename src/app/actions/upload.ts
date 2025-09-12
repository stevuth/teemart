
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';

/**
 * Uploads images to Supabase storage. This action is authenticated and will
 * only work if the user is logged in.
 * @param formData - The FormData object containing the files to upload.
 * @returns An object with either an array of image paths or an error message.
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

  const uploadPromises = files.map(file => {
    // The file path format MUST match RLS policies if they are in use.
    // e.g., <user_id>/<timestamp>-<filename>
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    return supabase.storage.from('product-images').upload(fileName, file);
  });

  const uploadResults = await Promise.all(uploadPromises);

  const paths: string[] = [];
  const errors: string[] = [];

  for (const result of uploadResults) {
    if (result.error) {
      console.error('Upload Error:', result.error);
      errors.push(result.error.message);
    } else {
      // Return the path instead of the public URL
      paths.push(result.data.path);
    }
  }

  if (errors.length > 0) {
    // If some uploads failed, you might want to return the specific errors.
    // For simplicity, we'll return a generic error if any upload fails.
    return { error: `Failed to upload ${errors.length} image(s): ${errors.join(', ')}` };
  }

  return { paths };
}
