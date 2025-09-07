
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

/**
 * Uploads verification documents (NIN and selfie) to a public Supabase storage bucket.
 * This action uses the admin client to bypass RLS for robust server-side uploads.
 * @param formData - The FormData object containing the 'ninImage' and 'selfieImage' files.
 * @returns An object with either the URLs of the uploaded files or an error message.
 */
export async function uploadVerificationDocumentsAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to upload documents.' };
  }

  const ninImage = formData.get('ninImage') as File | null;
  const selfieImage = formData.get('selfieImage') as File | null;

  if (!ninImage || !selfieImage) {
    return { success: false, error: 'Both NIN image and selfie are required.' };
  }

  const bucketName = 'public-verification-documents';
  let ninPublicUrl: string | undefined;
  let selfiePublicUrl: string | undefined;

  try {
    // Upload NIN Image
    const ninFileName = `${user.id}/${Date.now()}_nin_${ninImage.name}`;
    const { error: ninUploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(ninFileName, ninImage);

    if (ninUploadError) {
      console.error('NIN Upload Error:', ninUploadError);
      throw new Error('Failed to upload NIN image.');
    }
    ninPublicUrl = supabase.storage.from(bucketName).getPublicUrl(ninFileName).data.publicUrl;


    // Upload Selfie Image
    const selfieFileName = `${user.id}/${Date.now()}_selfie_${selfieImage.name}`;
    const { error: selfieUploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(selfieFileName, selfieImage);

    if (selfieUploadError) {
      console.error('Selfie Upload Error:', selfieUploadError);
      throw new Error('Failed to upload selfie image.');
    }
    selfiePublicUrl = supabase.storage.from(bucketName).getPublicUrl(selfieFileName).data.publicUrl;
    
    // Both uploads were successful, return the public URLs
    return { success: true, data: { ninPublicUrl, selfiePublicUrl } };

  } catch (error: any) {
    console.error("Server Action Upload Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during file upload." };
  }
}
