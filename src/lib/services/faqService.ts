import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type FAQ = Database['public']['Tables']['faqs']['Row'];
export type FAQInsert = Database['public']['Tables']['faqs']['Insert'];

export const getFAQs = async (): Promise<FAQ[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Failed to get FAQs:', error);
    return [];
  }

  return data;
};

export const createFAQ = async (faq: FAQInsert): Promise<FAQ | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('faqs')
    .insert(faq)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFAQ = async (id: string, updates: Partial<FAQInsert>): Promise<FAQ | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('faqs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteFAQ = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
