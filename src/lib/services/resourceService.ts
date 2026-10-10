import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type LearningResource = Database['public']['Tables']['learning_resources']['Row'];
export type LearningResourceInsert = Database['public']['Tables']['learning_resources']['Insert'];

export const getResources = async (): Promise<LearningResource[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('learning_resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get resources:', error);
    return [];
  }

  return data;
};

export const createResource = async (resource: LearningResourceInsert): Promise<LearningResource | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('learning_resources')
    .insert(resource)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteResource = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('learning_resources')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
