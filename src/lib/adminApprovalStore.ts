import { supabase, isSupabaseConfigured } from './supabase/client';
import { addLogEntry } from './activityLogStore';
import type { AdminRole } from './adminStore';
import {
  createAdminLoginRequestDB,
  getPendingAdminLoginRequestsDB,
  updateAdminLoginRequestDB,
} from './services/adminService';

export type LoginRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface AdminLoginRequest {
  id: string;
  adminId: string;
  adminName: string;
  mobile: string;
  dob: string;
  role: AdminRole;
  device: string;
  status: LoginRequestStatus;
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
  /** true when this is a NEW admin registration request (not yet in the system) */
  isNewRegistration?: boolean;
}

const STORAGE_KEY = 'ts_admin_login_requests';
const REQUEST_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes timeout

// Helper to get client device string
export const getClientDeviceString = (): string => {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

  let os = 'Desktop';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/win/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';

  return `${browser} on ${os}`;
};

// ─── LOCAL STORAGE GET/SAVE ────────────────────────────────────────────────

export const getStoredAdminLoginRequests = (): AdminLoginRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: AdminLoginRequest[] = JSON.parse(raw);
    const now = Date.now();

    // Mark outdated pending requests as expired
    let changed = false;
    const updated = list.map((req) => {
      if (req.status === 'pending' && now - new Date(req.requestedAt).getTime() > REQUEST_TIMEOUT_MS) {
        changed = true;
        return { ...req, status: 'expired' as LoginRequestStatus };
      }
      return req;
    });

    if (changed) {
      saveStoredAdminLoginRequests(updated);
    }
    return updated;
  } catch (_e) {
    return [];
  }
};

const saveStoredAdminLoginRequests = (requests: AdminLoginRequest[]) => {
  try {
    // Keep at most 30 recent requests
    const pruned = requests.slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch (_e) {}
};

// ─── BROADCASTING ──────────────────────────────────────────────────────────

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('ts_admin_auth_channel');
  } catch (_e) {
    broadcastChannel = null;
  }
}

// Global Supabase Realtime Channel for Cross-Device Approval
let supabaseBroadcastChannel: ReturnType<typeof supabase.channel> | null = null;
let isChannelSubscribed = false;

export const getSupabaseApprovalChannel = () => {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseBroadcastChannel) {
    try {
      supabaseBroadcastChannel = supabase.channel('ts_admin_login_approvals');
      supabaseBroadcastChannel
        .on('broadcast', { event: 'request_update' }, ({ payload }) => {
          if (!payload || !payload.id) return;
          const current = getStoredAdminLoginRequests();
          const exists = current.find((r) => r.id === payload.id);
          let next: AdminLoginRequest[];
          if (exists) {
            next = current.map((r) => (r.id === payload.id ? { ...r, ...payload } : r));
          } else {
            next = [payload, ...current];
          }
          saveStoredAdminLoginRequests(next);
          notifyLocalListeners();
        })
        .on('broadcast', { event: 'request_sync_query' }, () => {
          // If this client has any pending requests, broadcast them
          const pending = getPendingAdminLoginRequests();
          for (const p of pending) {
            broadcastChange(p);
          }
        })
        .subscribe((status) => {
          isChannelSubscribed = status === 'SUBSCRIBED';
        });
    } catch (_e) {
      supabaseBroadcastChannel = null;
    }
  }
  return supabaseBroadcastChannel;
};

// Initialize early
if (typeof window !== 'undefined') {
  getSupabaseApprovalChannel();
}

const notifyLocalListeners = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ts_admin_request_change'));
  }
};

const broadcastChange = (req: AdminLoginRequest) => {
  notifyLocalListeners();
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'request_update', payload: req });
    } catch (_e) {}
  }

  const channel = getSupabaseApprovalChannel();
  if (channel) {
    const doSend = () => {
      try {
        channel.send({
          type: 'broadcast',
          event: 'request_update',
          payload: req,
        }).then((res) => {
          if (res !== 'ok') {
            setTimeout(() => {
              channel.send({
                type: 'broadcast',
                event: 'request_update',
                payload: req,
              }).catch(() => {});
            }, 500);
          }
        }).catch(() => {});
      } catch (_e) {}
    };

    if (isChannelSubscribed) {
      doSend();
    } else {
      setTimeout(doSend, 400);
    }
  }
};

// Request sync from any active peers
export const queryRealtimeRequestsSync = () => {
  const channel = getSupabaseApprovalChannel();
  if (channel) {
    try {
      channel.send({
        type: 'broadcast',
        event: 'request_sync_query',
        payload: {},
      }).catch(() => {});
    } catch (_e) {}
  }
};

// Listen on BroadcastChannel for other tabs
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'request_update' && event.data.payload) {
      const payload: AdminLoginRequest = event.data.payload;
      const current = getStoredAdminLoginRequests();
      const exists = current.find((r) => r.id === payload.id);
      let next: AdminLoginRequest[];
      if (exists) {
        next = current.map((r) => (r.id === payload.id ? { ...r, ...payload } : r));
      } else {
        next = [payload, ...current];
      }
      saveStoredAdminLoginRequests(next);
      notifyLocalListeners();
    }
  };
}

// ─── ACTIONS ───────────────────────────────────────────────────────────────

/**
 * Creates a new pending login request from an admin.
 * Persists to Supabase for cross-device delivery.
 */
export const createAdminLoginRequest = (params: {
  adminId: string;
  adminName: string;
  mobile: string;
  dob: string;
  role: AdminRole;
  device?: string;
  isNewRegistration?: boolean;
}): AdminLoginRequest => {
  const current = getStoredAdminLoginRequests();
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const device = params.device || getClientDeviceString();
  const now = new Date().toISOString();
  // Registration requests should stay valid for 30 days so super admin can approve anytime
  const timeoutMs = params.isNewRegistration ? (30 * 24 * 60 * 60 * 1000) : REQUEST_TIMEOUT_MS;
  const expiresAt = new Date(Date.now() + timeoutMs).toISOString();

  const newRequest: AdminLoginRequest = {
    id,
    adminId: params.adminId,
    adminName: params.adminName,
    mobile: params.mobile,
    dob: params.dob,
    role: params.role,
    device,
    status: 'pending',
    requestedAt: now,
    isNewRegistration: params.isNewRegistration ?? false,
  };

  const updated = [newRequest, ...current.filter((r) => !(r.adminId === params.adminId && r.status === 'pending'))];
  saveStoredAdminLoginRequests(updated);
  broadcastChange(newRequest);

  // Persist to Supabase so super admin sees it even from a different device/session
  createAdminLoginRequestDB({
    id,
    admin_id: params.adminId,
    admin_name: params.adminName,
    mobile: params.mobile,
    dob: params.dob,
    role: params.role,
    device,
    status: 'pending',
    requested_at: now,
    expires_at: expiresAt,
    is_new_registration: params.isNewRegistration ?? false,
  }).catch((e) => console.warn('Failed to persist login request to Supabase:', e));

  return newRequest;
};

/**
 * Gets all pending requests for the Super Admin to review.
 */
export const getPendingAdminLoginRequests = (): AdminLoginRequest[] => {
  return getStoredAdminLoginRequests().filter((r) => r.status === 'pending');
};

/**
 * Approves a login request.
 */
export const approveAdminLoginRequest = (
  requestId: string,
  superAdminName: string = 'Super Admin'
): AdminLoginRequest | null => {
  const current = getStoredAdminLoginRequests();
  const target = current.find((r) => r.id === requestId);
  if (!target) return null;

  const approved: AdminLoginRequest = {
    ...target,
    status: 'approved',
    respondedAt: new Date().toISOString(),
    respondedBy: superAdminName,
  };

  const updated = current.map((r) => (r.id === requestId ? approved : r));
  saveStoredAdminLoginRequests(updated);
  broadcastChange(approved);

  // Update Supabase row so the requesting device can poll for the decision
  updateAdminLoginRequestDB(requestId, 'approved', superAdminName).catch((e) =>
    console.warn('Failed to update login request approval in Supabase:', e)
  );

  // Add to activity audit log
  try {
    addLogEntry({
      actor: superAdminName,
      action: `Approved admin login access for ${approved.adminName} (${approved.device})`,
      type: 'approve_admin_login',
      revertible: false,
      credentialId: approved.adminId,
    });
  } catch (_e) {}

  return approved;
};

/**
 * Rejects a login request.
 */
export const rejectAdminLoginRequest = (
  requestId: string,
  superAdminName: string = 'Super Admin'
): AdminLoginRequest | null => {
  const current = getStoredAdminLoginRequests();
  const target = current.find((r) => r.id === requestId);
  if (!target) return null;

  const rejected: AdminLoginRequest = {
    ...target,
    status: 'rejected',
    respondedAt: new Date().toISOString(),
    respondedBy: superAdminName,
  };

  const updated = current.map((r) => (r.id === requestId ? rejected : r));
  saveStoredAdminLoginRequests(updated);
  broadcastChange(rejected);

  // Update Supabase row so the requesting device sees the rejection
  updateAdminLoginRequestDB(requestId, 'rejected', superAdminName).catch((e) =>
    console.warn('Failed to update login request rejection in Supabase:', e)
  );

  // Add to activity audit log
  try {
    addLogEntry({
      actor: superAdminName,
      action: `Rejected admin login access for ${rejected.adminName} (${rejected.device})`,
      type: 'reject_admin_login',
      revertible: false,
      credentialId: rejected.adminId,
    });
  } catch (_e) {}

  return rejected;
};

/**
 * Cancels a pending login request by the requester.
 */
export const cancelAdminLoginRequest = (requestId: string): void => {
  const current = getStoredAdminLoginRequests();
  const target = current.find((r) => r.id === requestId);
  if (!target || target.status !== 'pending') return;

  const cancelled: AdminLoginRequest = {
    ...target,
    status: 'cancelled',
    respondedAt: new Date().toISOString(),
  };

  const updated = current.map((r) => (r.id === requestId ? cancelled : r));
  saveStoredAdminLoginRequests(updated);
  broadcastChange(cancelled);
};

// ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────

/**
 * Subscribes to real-time updates for all login requests.
 * Polls Supabase DB every 3 seconds + instant Realtime notifications.
 */
export const subscribeToAdminLoginRequests = (
  callback: (requests: AdminLoginRequest[]) => void
): (() => void) => {
  // Helper to merge DB rows into local state
  const mergeFromDB = async () => {
    try {
      const dbPending = await getPendingAdminLoginRequestsDB();
      if (dbPending.length > 0) {
        const current = getStoredAdminLoginRequests();
        const map = new Map<string, AdminLoginRequest>();
        for (const r of current) map.set(r.id, r);
        for (const db of dbPending) {
          const rawRole = (db.role as string);
          const role: AdminRole = rawRole === 'super_admin' ? 'super_admin' : rawRole === 'faculty' ? 'faculty' : 'member';
          const mapped: AdminLoginRequest = {
            id: db.id,
            adminId: db.admin_id,
            adminName: db.admin_name,
            mobile: db.mobile,
            dob: db.dob,
            role,
            device: db.device || 'Unknown',
            status: db.status as any,
            requestedAt: db.requested_at,
            respondedAt: db.responded_at || undefined,
            respondedBy: db.responded_by || undefined,
            isNewRegistration: (db as any).is_new_registration ?? false,
          };
          map.set(db.id, mapped);
        }
        const merged = Array.from(map.values());
        saveStoredAdminLoginRequests(merged);
      }
    } catch (_e) {}
    callback(getStoredAdminLoginRequests());
  };

  // Initial fire
  mergeFromDB();
  queryRealtimeRequestsSync();

  const handleUpdate = () => mergeFromDB();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) handleUpdate();
    });
    window.addEventListener('ts_admin_request_change', handleUpdate);
  }

  // Subscribe to Supabase Realtime postgres_changes for instant cross-device updates
  let realtimeSub: ReturnType<typeof supabase.channel> | null = null;
  if (isSupabaseConfigured()) {
    try {
      realtimeSub = supabase
        .channel('admin_login_requests_changes')
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'admin_login_requests' },
          () => { mergeFromDB(); }
        )
        .subscribe();
    } catch (_e) {}
  }

  // Poll DB every 3 seconds as a reliable fallback
  const intervalId = setInterval(handleUpdate, 3000);

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('ts_admin_request_change', handleUpdate);
    }
    clearInterval(intervalId);
    if (realtimeSub) {
      try { realtimeSub.unsubscribe(); } catch (_e) {}
    }
  };
};

/**
 * Subscribes to real-time status of a specific login request.
 * Polls Supabase DB every 2 seconds to detect approve/reject decisions cross-device.
 */
export const subscribeToSpecificRequest = (
  requestId: string,
  callback: (request: AdminLoginRequest | null) => void
): (() => void) => {
  const checkCurrent = async () => {
    // First check local storage
    const list = getStoredAdminLoginRequests();
    const local = list.find((r) => r.id === requestId) || null;

    // If locally it's still pending, also check DB for super admin's decision
    if (!local || local.status === 'pending') {
      try {
        if (isSupabaseConfigured()) {
          const { data } = await supabase
            .from('admin_login_requests')
            .select('*')
            .eq('id', requestId)
            .maybeSingle();

          if (data) {
            const rawRole = (data.role as string);
            const role: AdminRole = rawRole === 'super_admin' ? 'super_admin' : rawRole === 'faculty' ? 'faculty' : 'member';
            const mapped: AdminLoginRequest = {
              id: data.id,
              adminId: data.admin_id,
              adminName: data.admin_name,
              mobile: data.mobile,
              dob: data.dob,
              role,
              device: data.device || 'Unknown',
              status: data.status as any,
              requestedAt: data.requested_at,
              respondedAt: data.responded_at || undefined,
              respondedBy: data.responded_by || undefined,
              isNewRegistration: (data as any).is_new_registration ?? false,
            };
            // Update local cache with DB state
            const updated = list.map((r) => r.id === requestId ? mapped : r);
            if (!list.find((r) => r.id === requestId)) updated.push(mapped);
            saveStoredAdminLoginRequests(updated);
            callback(mapped);
            return;
          }
        }
      } catch (_e) {}
    }

    callback(local);
  };

  checkCurrent();

  const handleUpdate = () => checkCurrent();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) handleUpdate();
    });
    window.addEventListener('ts_admin_request_change', handleUpdate);
  }

  // Poll every 2 seconds — the admin's device needs to detect the super admin's decision
  const intervalId = setInterval(handleUpdate, 2000);

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('ts_admin_request_change', handleUpdate);
    }
    clearInterval(intervalId);
  };
};
