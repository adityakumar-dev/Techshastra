import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type AchievementInsert = Database['public']['Tables']['achievements']['Insert'];

export const getAchievements = async (): Promise<Achievement[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('achievement_date', { ascending: false });

  if (error) {
    console.error('Failed to get achievements:', error);
    return [];
  }

  return data;
};

export const createAchievement = async (achievement: AchievementInsert): Promise<Achievement | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('achievements')
    .insert(achievement)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAchievement = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
