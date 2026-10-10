import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type GalleryPhoto = Database['public']['Tables']['gallery_photos']['Row'];
export type GalleryPhotoInsert = Database['public']['Tables']['gallery_photos']['Insert'];

export const getGalleryPhotos = async (): Promise<GalleryPhoto[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get gallery photos:', error);
    return [];
  }

  return data;
};

export const createGalleryPhoto = async (photo: GalleryPhotoInsert): Promise<GalleryPhoto | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('gallery_photos')
    .insert(photo)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteGalleryPhoto = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('gallery_photos')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
