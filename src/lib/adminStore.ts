// ─── TYPES ───────────────────────────────────────────────────────────
export type AdminRole = "super_admin" | "admin" | "member" | "faculty";

export interface AdminCredential {
  id: string;
  name: string;
  mobile: string;
  dob: string;
  email?: string;
  role: AdminRole;
  is_blocked: boolean;
  blocked_at?: string;
  block_reason?: string;
  created_at: string;
}

export interface PageVisibility {
  id: string;
  page_path: string;
  page_name: string;
  is_visible: boolean;
  updated_at: string;
}

import {
  createAdminCredentialDB,
  getAdminCredentialsDB,
  deleteAdminCredentialDB,
  setAdminCredentialBlockDB,
  getPageVisibilityList,
  togglePageVisibilityDB,
  getSuperAdminFromDB,
  saveSuperAdminToDB,
  isSuperAdminConfiguredDB,
} from "./services/adminService";
import { supabase, isSupabaseConfigured } from "./supabase/client";

// ─── STORAGE KEYS ────────────────────────────────────────────────────
const STORAGE_KEY        = "ts_admin_credentials";
const PAGE_VISIBILITY_KEY = "ts_page_visibility";
const SUPER_ADMIN_KEY_STORAGE = "ts_super_admin_key";

// ─── CREDENTIAL KEY ──────────────────────────────────────────────────
// Format: lowercased-name + mobile + dob (same as before, kept compatible)
const generateCredKey = (name: string, mobile: string, dob: string): string =>
  `${name.toLowerCase().trim()}${mobile}${dob}`;

// ─── SUPER ADMIN (configurable, server-backed) ──────────────────────────
/**
 * Super admin credentials are stored BOTH in Supabase (admin_credentials with role=super_admin)
 * AND in localStorage as a fast cache.
 *
 * This ensures:
 * - Setup page shows only ONCE globally (on any device)
 * - Other devices can verify super admin credentials via Supabase
 * - Works offline (localStorage fallback)
 */
const DEFAULT_SUPER_ADMIN = { name: "Super Admin", mobile: "1234567890", dob: "2000-01-01" };

export const getSuperAdminKey = (): string => {
  const stored = localStorage.getItem(SUPER_ADMIN_KEY_STORAGE);
  if (stored) return stored;
  // First run — persist the default so it can be changed later
  const key = generateCredKey(DEFAULT_SUPER_ADMIN.name, DEFAULT_SUPER_ADMIN.mobile, DEFAULT_SUPER_ADMIN.dob);
  localStorage.setItem(SUPER_ADMIN_KEY_STORAGE, key);
  return key;
};

/**
 * Set super admin credentials: saves to localStorage AND Supabase.
 * This is the canonical write path — called only from the setup form.
 */
export const setSuperAdminCredentials = async (name: string, mobile: string, dob: string): Promise<void> => {
  const key = generateCredKey(name, mobile, dob);
  localStorage.setItem(SUPER_ADMIN_KEY_STORAGE, key);
  // Persist to Supabase so setup is globally one-time
  try {
    await saveSuperAdminToDB(name, mobile, dob);
  } catch (e) {
    console.warn('Failed to save super admin to Supabase:', e);
  }
};

/**
 * Synchronous local-only check (used as fast initial state).
 * Only reliable when localStorage is already populated (i.e. same device).
 */
export const isSuperAdminDefaultLocal = (): boolean => {
  const key = localStorage.getItem(SUPER_ADMIN_KEY_STORAGE);
  const defaultKey = generateCredKey(DEFAULT_SUPER_ADMIN.name, DEFAULT_SUPER_ADMIN.mobile, DEFAULT_SUPER_ADMIN.dob);
  return !key || key === defaultKey;
};

/**
 * Async global check: returns true if NO super admin exists anywhere
 * (neither in localStorage nor in Supabase). Shows setup only once globally.
 */
export const isSuperAdminSetupNeeded = async (): Promise<boolean> => {
  // If Supabase is configured, check database directly as the source of truth
  if (isSupabaseConfigured()) {
    try {
      const isConfigured = await isSuperAdminConfiguredDB();
      return !isConfigured; // If not configured in DB, setup is needed
    } catch (_e) {}
  }

  // Fallback for offline mode: check localStorage
  return isSuperAdminDefaultLocal();
};

/** @deprecated Use isSuperAdminSetupNeeded() for cross-device correctness */
export const isSuperAdminDefault = (): boolean => isSuperAdminDefaultLocal();

// ─── STORAGE HELPERS ─────────────────────────────────────────────────
const getCredentials = (): AdminCredential[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const list: any[] = JSON.parse(data);
    return list.map((c) => ({
      ...c,
      role: c.role === "super_admin" ? "super_admin" : c.role === "faculty" ? "faculty" : "member",
    }));
  } catch {
    return [];
  }
};

export const getStoredCredentials = getCredentials;

const saveCredentials = (creds: AdminCredential[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
};

// ─── AUTH ────────────────────────────────────────────────────────────

// Normalization helpers for bulletproof login matching
export const cleanName = (n: string): string => n.toLowerCase().trim().replace(/\s+/g, ' ');
export const cleanMobile = (m: string): string => m.replace(/[^0-9]/g, '');
export const cleanDob = (d: string): string => d.trim().replace(/\//g, '-');

export const matchMobile = (m1: string, m2: string): boolean => {
  const c1 = cleanMobile(m1);
  const c2 = cleanMobile(m2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  // Matches if last 10 digits match (handles +91 or country codes)
  if (c1.length >= 10 && c2.length >= 10 && c1.slice(-10) === c2.slice(-10)) return true;
  return false;
};

export type VerifyResult =
  | { success: true;  role: AdminRole; id: string }
  | { success: false; blocked: true;  name: string }
  | { success: false; blocked: false };

/** Verify login credentials for Super Admin portal exclusively */
export const verifySuperAdmin = async (
  name: string,
  mobile: string,
  dob: string
): Promise<{ success: boolean; name?: string }> => {
  const sName = cleanName(name);
  const sMobile = cleanMobile(mobile);
  const sDob = cleanDob(dob);

  // 1. Authoritative check via secure RPC verify_admin_login (bypasses RLS safely)
  if (isSupabaseConfigured()) {
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)('verify_admin_login', {
        p_name: sName,
        p_mobile: sMobile,
        p_dob: sDob,
      });

      if (!rpcErr && rpcRes) {
        if (rpcRes.success && rpcRes.role === 'super_admin') {
          if (rpcRes.session_token && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('ts_admin_token', rpcRes.session_token);
          }
          if (rpcRes.session_id && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('ts_active_session_id', rpcRes.session_id);
          }
          return { success: true, name: rpcRes.name };
        }
        if (rpcRes.blocked || rpcRes.success === false) {
          return { success: false };
        }
      }
    } catch (_e) {}
  }

  // 2. Fallback to localStorage configured key (offline mode)
  const localKey = localStorage.getItem(SUPER_ADMIN_KEY_STORAGE);
  const defaultKey = generateCredKey(DEFAULT_SUPER_ADMIN.name, DEFAULT_SUPER_ADMIN.mobile, DEFAULT_SUPER_ADMIN.dob);
  const targetKey = generateCredKey(name, mobile, dob);
  if (localKey && localKey !== defaultKey && localKey === targetKey) {
    return { success: true, name };
  }

  // 3. Fresh install default credentials (only if no custom super admin has ever been saved)
  if (!localKey) {
    if (
      sName === cleanName(DEFAULT_SUPER_ADMIN.name) &&
      matchMobile(sMobile, DEFAULT_SUPER_ADMIN.mobile) &&
      sDob === cleanDob(DEFAULT_SUPER_ADMIN.dob)
    ) {
      return { success: true, name: DEFAULT_SUPER_ADMIN.name };
    }
  }

  return { success: false };
};

/** Verify login credentials — with multi-format resilience and cross-tab credential support */
export const verifyAdmin = (
  name: string,
  mobile: string,
  dob: string,
  customCreds?: AdminCredential[]
): VerifyResult => {
  let searchName = name.trim();
  let searchMobile = mobile.trim();
  let searchDob = dob.trim();

  // If user pasted comma-separated credentials into the first field
  if (searchName.includes(",")) {
    const parts = searchName.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      searchName = parts[0];
      if (!searchMobile) searchMobile = parts[1];
      if (!searchDob) searchDob = parts[2];
    }
  }

  const targetKey = generateCredKey(searchName, searchMobile, searchDob);

  // 1. Check super admin
  const superKey = getSuperAdminKey();
  const defaultKey = generateCredKey(DEFAULT_SUPER_ADMIN.name, DEFAULT_SUPER_ADMIN.mobile, DEFAULT_SUPER_ADMIN.dob);
  const isCustomSuperSet = superKey && superKey !== defaultKey;
  const isSuper = isCustomSuperSet
    ? targetKey === superKey
    : (
        cleanName(searchName) === cleanName(DEFAULT_SUPER_ADMIN.name) &&
        matchMobile(searchMobile, DEFAULT_SUPER_ADMIN.mobile) &&
        cleanDob(searchDob) === cleanDob(DEFAULT_SUPER_ADMIN.dob)
      );

  if (isSuper) {
    return { success: true, role: "super_admin", id: "super_admin" };
  }

  // 2. Check regular admins in both custom pool and localStorage
  const localCreds = getCredentials();
  const pool = [...(customCreds || []), ...localCreds];
  const uniquePool = Array.from(new Map(pool.map((c) => [c.id, c])).values());

  const admin = uniquePool.find((c) => {
    const keyMatch = generateCredKey(c.name, c.mobile, c.dob) === targetKey;
    const fuzzyMatch = (
      cleanName(c.name) === cleanName(searchName) &&
      matchMobile(c.mobile, searchMobile) &&
      cleanDob(c.dob) === cleanDob(searchDob)
    );
    return keyMatch || fuzzyMatch;
  });

  if (!admin) return { success: false, blocked: false };
  if (admin.is_blocked) return { success: false, blocked: true, name: admin.name };
  const effectiveRole: AdminRole = admin.role === "faculty" ? "faculty" : "member";
  return { success: true, role: effectiveRole, id: admin.id };
};

/** Get user role by ID */
export const getUserRole = async (userId: string): Promise<AdminRole | null> => {
  if (userId === "super_admin") return "super_admin";
  const creds = getCredentials();
  const admin = creds.find(c => c.id === userId);
  if (!admin) return null;
  return admin.role === "faculty" ? "faculty" : "member";
};

/** Check if user is blocked */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  if (userId === "super_admin") return false;
  const creds = getCredentials();
  const admin = creds.find(c => c.id === userId);
  return admin ? admin.is_blocked : false;
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────

export const getAdminUsers = async (): Promise<AdminCredential[]> => {
  try {
    const remote = await getAdminCredentialsDB();
    if (remote && remote.length >= 0) {
      const mapped: AdminCredential[] = remote.map((r) => {
        const rawRole = r.role as string;
        const role: AdminRole = rawRole === "super_admin"
          ? "super_admin"
          : rawRole === "faculty"
            ? "faculty"
            : "member";
        return {
          id: r.id,
          name: r.name,
          mobile: r.mobile,
          dob: r.dob,
          email: r.email || undefined,
          role,
          is_blocked: r.is_blocked,
          blocked_at: r.blocked_at || undefined,
          block_reason: r.block_reason || undefined,
          created_at: r.created_at,
        };
      });
      // Overwrite local credentials cache with authoritative DB state
      saveCredentials(mapped);
      return mapped;
    }
  } catch (_e) {}
  return getCredentials();
};

export const createAdminCredential = (
  name: string,
  mobile: string,
  dob: string,
  role: AdminRole = "member",
  email?: string
): AdminCredential => {
  const creds = getCredentials();
  const id = crypto.randomUUID();
  // Ensure legacy or ambiguous roles normalize
  const normalizedRole: AdminRole = role === "faculty" ? "faculty" : "member";
  const newCred: AdminCredential = {
    id,
    name: name.trim(),
    mobile: mobile.trim(),
    dob: dob.trim(),
    email: email?.trim(),
    role: normalizedRole,
    is_blocked: false,
    created_at: new Date().toISOString(),
  };
  creds.push(newCred);
  saveCredentials(creds);

  // Sync directly to Supabase PostgreSQL in background
  createAdminCredentialDB({
    id,
    name: newCred.name,
    mobile: newCred.mobile,
    dob: newCred.dob,
    email: newCred.email || null,
    role: normalizedRole,
    is_blocked: false,
  }).catch((err) => {
    console.warn("Failed to sync new admin credential to Supabase:", err);
  });

  return newCred;
};

export const updateAdminRole = async (userId: string, newRole: AdminRole): Promise<void> => {
  const creds = getCredentials();
  const target = creds.find(c => c.id === userId);
  const mobile = target?.mobile;

  const index = creds.findIndex(c => c.id === userId);
  if (index !== -1) {
    creds[index].role = newRole;
    saveCredentials(creds);
  }

  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('admin_credentials').update({ role: newRole });
      if (mobile) {
        query = query.or(`id.eq.${userId},mobile.eq.${mobile}`);
      } else {
        query = query.eq('id', userId);
      }
      await query;
    }
  } catch (e) {
    console.warn("Failed to update admin role in Supabase:", e);
  }
};

export const blockAdmin = (userId: string, reason?: string): void => {
  const creds = getCredentials();
  const target = creds.find(c => c.id === userId);
  const mobile = target?.mobile;

  const index = creds.findIndex(c => c.id === userId);
  if (index !== -1) {
    creds[index].is_blocked = true;
    creds[index].blocked_at = new Date().toISOString();
    creds[index].block_reason = reason;
    saveCredentials(creds);
  }
  setAdminCredentialBlockDB(userId, true, reason, mobile).catch((e) =>
    console.warn("Failed to block admin in Supabase:", e)
  );
};

export const unblockAdmin = (userId: string): void => {
  const creds = getCredentials();
  const target = creds.find(c => c.id === userId);
  const mobile = target?.mobile;

  const index = creds.findIndex(c => c.id === userId);
  if (index !== -1) {
    creds[index].is_blocked = false;
    creds[index].blocked_at = undefined;
    creds[index].block_reason = undefined;
    saveCredentials(creds);
  }
  setAdminCredentialBlockDB(userId, false, undefined, mobile).catch((e) =>
    console.warn("Failed to unblock admin in Supabase:", e)
  );
};

export const deleteAdminCredential = (userId: string): void => {
  const creds = getCredentials();
  const target = creds.find(c => c.id === userId);
  const mobile = target?.mobile;

  saveCredentials(getCredentials().filter(c => c.id !== userId && (!mobile || c.mobile !== mobile)));
  deleteAdminCredentialDB(userId, mobile).catch((e) =>
    console.warn("Failed to delete admin in Supabase:", e)
  );
};

// ─── PAGE VISIBILITY ─────────────────────────────────────────────────

const getPageVisibility = (): PageVisibility[] => {
  const data = localStorage.getItem(PAGE_VISIBILITY_KEY);
  return data ? JSON.parse(data) : [];
};

export const getStoredPageVisibility = getPageVisibility;

const savePageVisibility = (pages: PageVisibility[]): void => {
  localStorage.setItem(PAGE_VISIBILITY_KEY, JSON.stringify(pages));
};

export const getAllPageVisibility = async (): Promise<PageVisibility[]> => {
  try {
    const remote = await getPageVisibilityList();
    if (remote && remote.length > 0) {
      const mapped: PageVisibility[] = remote.map((r) => ({
        id: r.id,
        page_path: r.page_path,
        page_name: r.page_name,
        is_visible: r.is_visible,
        updated_at: r.updated_at,
      }));
      savePageVisibility(mapped);
      return mapped;
    }
  } catch (_e) {}
  return getPageVisibility();
};

export const togglePageVisibility = async (pageId: string): Promise<void> => {
  const pages = getPageVisibility();
  const index = pages.findIndex(p => p.id === pageId);
  if (index !== -1) {
    const newStatus = !pages[index].is_visible;
    pages[index].is_visible = newStatus;
    pages[index].updated_at = new Date().toISOString();
    savePageVisibility(pages);

    togglePageVisibilityDB(pageId, !newStatus).catch((e) =>
      console.warn("Failed to toggle page visibility in Supabase:", e)
    );
  }
};

/** Set a page's visibility directly (used by revert logic) */
export const setPageVisibility = async (pageId: string, isVisible: boolean): Promise<void> => {
  const pages = getPageVisibility();
  const index = pages.findIndex(p => p.id === pageId);
  if (index !== -1) {
    pages[index].is_visible = isVisible;
    pages[index].updated_at = new Date().toISOString();
    savePageVisibility(pages);

    togglePageVisibilityDB(pageId, !isVisible).catch((e) =>
      console.warn("Failed to set page visibility in Supabase:", e)
    );
  }
};

export const initializePages = (): void => {
  if (getPageVisibility().length > 0) return;
  const defaults: PageVisibility[] = [
    { id: "1", page_path: "/projects",    page_name: "Projects",    is_visible: true, updated_at: new Date().toISOString() },
    { id: "2", page_path: "/events",      page_name: "Events",      is_visible: true, updated_at: new Date().toISOString() },
    { id: "3", page_path: "/blog",        page_name: "Blog",        is_visible: true, updated_at: new Date().toISOString() },
    { id: "4", page_path: "/gallery",     page_name: "Gallery",     is_visible: true, updated_at: new Date().toISOString() },
    { id: "5", page_path: "/achievements",page_name: "Achievements",is_visible: true, updated_at: new Date().toISOString() },
    { id: "6", page_path: "/publications",page_name: "Publications",is_visible: true, updated_at: new Date().toISOString() },
    { id: "7", page_path: "/resources",   page_name: "Resources",   is_visible: true, updated_at: new Date().toISOString() },
    { id: "8", page_path: "/faq",         page_name: "FAQ",         is_visible: true, updated_at: new Date().toISOString() },
    { id: "9", page_path: "/socials",     page_name: "Socials",     is_visible: true, updated_at: new Date().toISOString() },
  ];
  savePageVisibility(defaults);
};

initializePages();

export * from './adminApprovalStore';
