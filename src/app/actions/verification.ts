
'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";

/**
 * Uploads verification documents (NIN and selfie) to a public Supabase storage bucket.
 * This action is authenticated and uses the user's session to perform the upload.
 * @param formData - The FormData object containing the 'ninImage' and 'selfieImage' files.
 * @returns An object with either the URLs of the uploaded files or an error message.
 */
export async function uploadVerificationDocumentsAction(formData: FormData) {
  // Use the standard server client, which acts on behalf of the logged-in user.
  const supabase = createSupabaseServerClient();

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
    // The RLS policy we created allows the authenticated user to insert into this bucket.
    // The file path includes the user's ID for organization.
    const ninFileName = `${user.id}/${Date.now()}_nin_${ninImage.name}`;
    const { error: ninUploadError } = await supabase.storage
      .from(bucketName)
      .upload(ninFileName, ninImage);

    if (ninUploadError) {
      console.error('NIN Upload Error:', ninUploadError);
      throw new Error(`Failed to upload NIN image: ${ninUploadError.message}`);
    }
    ninPublicUrl = supabase.storage.from(bucketName).getPublicUrl(ninFileName).data.publicUrl;


    // Upload Selfie Image
    const selfieFileName = `${user.id}/${Date.now()}_selfie_${selfieImage.name}`;
    const { error: selfieUploadError } = await supabase.storage
      .from(bucketName)
      .upload(selfieFileName, selfieImage);

    if (selfieUploadError) {
      console.error('Selfie Upload Error:', selfieUploadError);
      throw new Error(`Failed to upload selfie image: ${selfieUploadError.message}`);
    }
    selfiePublicUrl = supabase.storage.from(bucketName).getPublicUrl(selfieFileName).data.publicUrl;
    
    // Both uploads were successful, return the public URLs
    return { success: true, data: { ninPublicUrl, selfiePublicUrl } };

  } catch (error: any) {
    console.error("Server Action Upload Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during file upload." };
  }
}
