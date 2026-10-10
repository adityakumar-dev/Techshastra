import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database, CertificateStatus } from '../supabase/types';

export type Certificate = Database['public']['Tables']['certificates']['Row'];
export type CertificateInsert = Database['public']['Tables']['certificates']['Insert'];
export type CertificateJob = Database['public']['Tables']['certificate_jobs']['Row'];

/**
 * Generate a unique verification code: e.g. TS-2026-X8K9M2
 */
export const generateVerificationId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TS-${new Date().getFullYear()}-${rand}`;
};

/**
 * Public verification lookup for /verify/:certificateId
 * Only returns public metadata, never internal sensitive data.
 */
export const verifyCertificateById = async (verificationId: string) => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('certificates')
    .select('verification_id, recipient_name, event_name, issue_date, status, certificate_url')
    .eq('verification_id', verificationId.trim().toUpperCase())
    .single();

  if (error || !data) return null;
  return data;
};

/**
 * Record a batch of generated certificates into PostgreSQL.
 */
export const recordCertificatesBatch = async (
  certificates: CertificateInsert[]
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('certificates')
    .insert(certificates);

  if (error) {
    console.error('Failed to record certificates batch:', error);
    throw error;
  }

  return true;
};

/**
 * Admin: Get all issued certificates.
 */
export const getAllCertificates = async (): Promise<Certificate[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get certificates:', error);
    return [];
  }

  return data;
};

/**
 * Admin: Revoke or reactivate a certificate.
 */
export const setCertificateStatus = async (
  id: string,
  status: CertificateStatus
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('certificates')
    .update({ status })
    .eq('id', id);

  return !error;
};

/**
 * Record a certificate delivery job.
 */
export const createCertificateJob = async (
  totalRecipients: number,
  createdBy?: string
): Promise<CertificateJob | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('certificate_jobs')
    .insert({
      total_recipients: totalRecipients,
      successful_sends: 0,
      failed_sends: 0,
      status: 'processing',
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (error) return null;
  return data;
};

/**
 * Update certificate job progress.
 */
export const updateCertificateJobProgress = async (
  jobId: string,
  successful: number,
  failed: number,
  status: string = 'processing',
  errorLog?: string
): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from('certificate_jobs')
    .update({
      successful_sends: successful,
      failed_sends: failed,
      status,
      error_log: errorLog || null,
    })
    .eq('id', jobId);
};
