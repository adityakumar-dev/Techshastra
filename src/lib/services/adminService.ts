import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database, UserRole } from '../supabase/types';

export type AdminSession = Database['public']['Tables']['admin_sessions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type PageVisibility = Database['public']['Tables']['page_visibility']['Row'];

// ─── ADMIN SESSIONS ("Who is using my panel?") ───────────────────────

export type AdminCredentialDB = Database['public']['Tables']['admin_credentials']['Row'];
export type AdminCredentialInsert = Database['public']['Tables']['admin_credentials']['Insert'];

/**
 * Create a new admin credential in PostgreSQL.
 */
export const createAdminCredentialDB = async (
  cred: AdminCredentialInsert
): Promise<AdminCredentialDB | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('admin_credentials')
    .insert(cred)
    .select()
    .single();

  if (error) {
    console.error('Failed to insert admin credential in Supabase:', error);
    throw error;
  }
  return data;
};

/**
 * Fetch all admin credentials from PostgreSQL.
 */
export const getAdminCredentialsDB = async (): Promise<AdminCredentialDB[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('admin_credentials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get admin credentials from Supabase:', error);
    return [];
  }
  return data;
};

/**
 * Delete an admin credential from PostgreSQL.
 */
export const deleteAdminCredentialDB = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('admin_credentials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete admin credential in Supabase:', error);
    throw error;
  }
  return true;
};

/**
 * Block or unblock an admin credential.
 */
export const setAdminCredentialBlockDB = async (
  id: string,
  isBlocked: boolean,
  reason?: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('admin_credentials')
    .update({
      is_blocked: isBlocked,
      blocked_at: isBlocked ? new Date().toISOString() : null,
      block_reason: isBlocked ? (reason || 'Blocked by Super Admin') : null,
    })
    .eq('id', id);

  return !error;
};

// ─── ADMIN SESSIONS ("Who is using my panel?") ───────────────────────

/**
 * Register a new active admin session.
 */
export const registerAdminSession = async (
  adminName: string = 'Admin',
  adminCredentialId?: string | null,
  userId?: string | null,
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) return null;

  const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Parse simple device/browser info from userAgent
  const isMobile = /mobile/i.test(userAgent);
  const device = isMobile ? 'Mobile Device' : 'Desktop';
  let browser = 'Unknown Browser';
  if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';

  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_name: adminName,
      admin_credential_id: adminCredentialId || null,
      user_id: userId || null,
      session_token: sessionToken,
      user_agent: userAgent,
      browser,
      device,
      is_active: true,
      last_activity: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to register admin session:', error);
    return null;
  }

  // Save current active session ID to sessionStorage for this tab
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('ts_active_session_id', data.id);
  }
  return data;
};

/**
 * Update the last activity timestamp of an admin session.
 */
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  if (!isSupabaseConfigured() || !sessionId) return;

  await supabase
    .from('admin_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', sessionId);
};

/**
 * Fetch all active admin sessions.
 */
export const getActiveAdminSessions = async (): Promise<AdminSession[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('is_active', true)
    .order('last_activity', { ascending: false });

  if (error) {
    console.error('Failed to get active admin sessions:', error);
    return [];
  }

  return data;
};

/**
 * Revoke an admin session.
 */
export const revokeAdminSession = async (sessionId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('admin_sessions')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to revoke admin session:', error);
    return false;
  }

  // If this tab was revoked, clear local session
  if (sessionStorage.getItem('ts_active_session_id') === sessionId) {
    sessionStorage.removeItem('ts_active_session_id');
  }

  return true;
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────

/**
 * Log a sensitive administrative action.
 */
export const logAdminAction = async (
  actorId: string | null,
  actorName: string,
  actorRole: UserRole,
  action: string,
  entityType: string,
  entityId?: string | null,
  details: Record<string, any> = {}
): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details,
    });
  } catch (e) {
    console.error('Failed to log admin action:', e);
  }
};

/**
 * Get recent system audit logs.
 */
export const getAuditLogs = async (limit: number = 50): Promise<AuditLog[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }

  return data;
};

// ─── PAGE VISIBILITY ──────────────────────────────────────────────────

/**
 * Get all page visibility settings.
 */
export const getPageVisibilityList = async (): Promise<PageVisibility[]> => {
  if (!isSupabaseConfigured()) {
    return [
      { id: '1', page_path: '/projects', page_name: 'Projects', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '2', page_path: '/events', page_name: 'Events', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '3', page_path: '/blog', page_name: 'Blog', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '4', page_path: '/gallery', page_name: 'Gallery', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '5', page_path: '/achievements', page_name: 'Achievements', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '6', page_path: '/publications', page_name: 'Publications', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '7', page_path: '/resources', page_name: 'Resources', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '8', page_path: '/faq', page_name: 'FAQ', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
      { id: '9', page_path: '/socials', page_name: 'Socials', is_visible: true, updated_by: null, updated_at: new Date().toISOString() },
    ];
  }

  const { data, error } = await supabase
    .from('page_visibility')
    .select('*')
    .order('page_name');

  if (error) {
    console.error('Failed to get page visibility:', error);
    return [];
  }

  return data;
};

/**
 * Toggle a page's visibility in PostgreSQL.
 */
export const togglePageVisibilityDB = async (
  pageId: string,
  currentStatus: boolean,
  updatedByUserId?: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('page_visibility')
    .update({
      is_visible: !currentStatus,
      updated_by: updatedByUserId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  return !error;
};

// ─── ADMIN USER MANAGEMENT ────────────────────────────────────────────

/**
 * Fetch all admins and super admins.
 */
export const getAdminUsersDB = async () => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'super_admin', 'editor'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get admin users:', error);
    return [];
  }

  return data;
};

/**
 * Block or unblock an admin user.
 */
export const setAdminBlockStatusDB = async (
  userId: string,
  isBlocked: boolean,
  reason?: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('profiles')
    .update({
      is_blocked: isBlocked,
      blocked_at: isBlocked ? new Date().toISOString() : null,
      block_reason: isBlocked ? (reason || 'Blocked by Super Admin') : null,
    })
    .eq('id', userId);

  return !error;
};
