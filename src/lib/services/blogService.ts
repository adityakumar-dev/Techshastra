import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch blog posts:', error);
    return [];
  }

  return data;
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
};

export const createBlogPost = async (post: BlogPostInsert): Promise<BlogPost | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBlogPost = async (id: string, updates: Partial<BlogPostInsert>): Promise<BlogPost | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBlogPost = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
