import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database, ApplicationStatus } from '../supabase/types';

export type MembershipApplication = Database['public']['Tables']['membership_applications']['Row'];
export type MembershipApplicationInsert = Database['public']['Tables']['membership_applications']['Insert'];

/**
 * Public submission of membership/collaboration application.
 */
export const submitMembershipApplication = async (
  application: Omit<MembershipApplicationInsert, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<MembershipApplication | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('[TECHSHASTRA] Backend not connected. Application will not persist to PostgreSQL.');
    return null;
  }

  const { data, error } = await supabase
    .from('membership_applications')
    .insert({
      ...application,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to submit application:', error);
    throw error;
  }

  return data;
};

/**
 * Admin: Get all applications.
 */
export const getMembershipApplications = async (): Promise<MembershipApplication[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('membership_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get applications:', error);
    return [];
  }

  return data;
};

/**
 * Admin: Review an application (update status and notes).
 */
export const reviewMembershipApplication = async (
  id: string,
  status: ApplicationStatus,
  reviewerId?: string,
  reviewNotes?: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('membership_applications')
    .update({
      status,
      reviewer_id: reviewerId || null,
      review_notes: reviewNotes || null,
    })
    .eq('id', id);

  return !error;
};
