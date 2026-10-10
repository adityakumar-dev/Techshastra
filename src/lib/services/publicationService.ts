import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type Publication = Database['public']['Tables']['publications']['Row'];
export type PublicationInsert = Database['public']['Tables']['publications']['Insert'];

export const getPublications = async (): Promise<Publication[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Failed to get publications:', error);
    return [];
  }

  return data;
};

export const createPublication = async (pub: PublicationInsert): Promise<Publication | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('publications')
    .insert(pub)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePublication = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('publications')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
