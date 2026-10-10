import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type SocialLink = Database['public']['Tables']['social_links']['Row'];
export type SocialLinkInsert = Database['public']['Tables']['social_links']['Insert'];

export const getSocialLinks = async (): Promise<SocialLink[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('posted_at', { ascending: false });

  if (error) {
    console.error('Failed to get social links:', error);
    return [];
  }

  return data;
};

export const createSocialLink = async (link: SocialLinkInsert): Promise<SocialLink | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('social_links')
    .insert(link)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSocialLink = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('social_links')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
