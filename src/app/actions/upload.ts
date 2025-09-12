
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';

/**
 * DEPRECATED: This action is no longer recommended for use.
 * Image uploads are now handled directly on the client-side in the SellForm component
 * to prevent server timeouts and improve user experience. This file is kept for
 * reference but should not be used in new implementations.
 *
 * @deprecated
 * @param formData - The FormData object containing the files to upload.
 * @returns An object with an error message.
 */
export async function uploadImagesAction(formData: FormData) {
  console.warn("DEPRECATED: uploadImagesAction is called. Refactor to use client-side uploads.");
  return { error: 'This server action is deprecated. Uploads are handled on the client.' };
}
