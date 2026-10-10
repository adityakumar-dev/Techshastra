import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database, ContactStatus } from '../supabase/types';

export type ContactMessage = Database['public']['Tables']['contact_messages']['Row'];
export type ContactMessageInsert = Database['public']['Tables']['contact_messages']['Insert'];

/**
 * Public visitor submission: writes directly to PostgreSQL.
 */
export const submitContactMessage = async (
  message: Omit<ContactMessageInsert, 'id' | 'created_at' | 'status'>
): Promise<ContactMessage | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('[TECHSHASTRA] Backend not connected. Message will not persist to PostgreSQL.');
    return null;
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      ...message,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to submit contact message:', error);
    throw error;
  }

  return data;
};

/**
 * Admin: Get all contact messages.
 */
export const getContactMessages = async (): Promise<ContactMessage[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get contact messages:', error);
    return [];
  }

  return data;
};

/**
 * Admin: Update message status (e.g. mark read, resolved).
 */
export const updateMessageStatus = async (
  id: string,
  status: ContactStatus
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('contact_messages')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  return !error;
};

/**
 * Admin: Delete a contact message.
 */
export const deleteContactMessage = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);

  return !error;
};
