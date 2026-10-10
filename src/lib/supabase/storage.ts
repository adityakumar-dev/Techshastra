import { supabase, isSupabaseConfigured } from './client';

export type StorageBucket = 
  | 'avatars' 
  | 'gallery' 
  | 'publications' 
  | 'projects' 
  | 'certificates' 
  | 'resumes';

/**
 * Upload a file to a Supabase Storage bucket and retrieve its public URL.
 */
export const uploadFile = async (
  bucket: StorageBucket,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; contentType?: string }
): Promise<{ url: string | null; error: Error | null }> => {
  if (!isSupabaseConfigured()) {
    return {
      url: null,
      error: new Error('Supabase is not configured. Please configure .env to upload files.'),
    };
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options?.upsert ?? true,
        contentType: options?.contentType,
      });

    if (uploadError) {
      console.error(`Error uploading to ${bucket}/${path}:`, uploadError);
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { url: null, error };
  }
};

/**
 * Delete a file from a Supabase Storage bucket.
 */
export const deleteFile = async (
  bucket: StorageBucket,
  paths: string[]
): Promise<{ error: Error | null }> => {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return { error };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { error };
  }
};
