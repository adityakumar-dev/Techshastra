import { supabase, isSupabaseConfigured } from './supabase/client';
import { addLogEntry } from './activityLogStore';

export type LoginRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface AdminLoginRequest {
  id: string;
  adminId: string;
  adminName: string;
  mobile: string;
  dob: string;
  role: 'admin';
  device: string;
  status: LoginRequestStatus;
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
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
if (isSupabaseConfigured()) {
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
      .subscribe();
  } catch (_e) {
    supabaseBroadcastChannel = null;
  }
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
  if (supabaseBroadcastChannel && isSupabaseConfigured()) {
    try {
      supabaseBroadcastChannel.send({
        type: 'broadcast',
        event: 'request_update',
        payload: req,
      });
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
 */
export const createAdminLoginRequest = (params: {
  adminId: string;
  adminName: string;
  mobile: string;
  dob: string;
  role: 'admin';
  device?: string;
}): AdminLoginRequest => {
  const current = getStoredAdminLoginRequests();
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const device = params.device || getClientDeviceString();

  const newRequest: AdminLoginRequest = {
    id,
    adminId: params.adminId,
    adminName: params.adminName,
    mobile: params.mobile,
    dob: params.dob,
    role: params.role,
    device,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  const updated = [newRequest, ...current.filter((r) => !(r.adminId === params.adminId && r.status === 'pending'))];
  saveStoredAdminLoginRequests(updated);
  broadcastChange(newRequest);
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
 */
export const subscribeToAdminLoginRequests = (
  callback: (requests: AdminLoginRequest[]) => void
): (() => void) => {
  // Initial fire
  callback(getStoredAdminLoginRequests());

  const handleUpdate = () => {
    callback(getStoredAdminLoginRequests());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) handleUpdate();
    });
    window.addEventListener('ts_admin_request_change', handleUpdate);
  }

  // Poll fallback every 1.5 seconds to handle any cross-tab timing
  const intervalId = setInterval(handleUpdate, 1500);

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('ts_admin_request_change', handleUpdate);
    }
    clearInterval(intervalId);
  };
};

/**
 * Subscribes to real-time status of a specific login request.
 */
export const subscribeToSpecificRequest = (
  requestId: string,
  callback: (request: AdminLoginRequest | null) => void
): (() => void) => {
  const checkCurrent = () => {
    const list = getStoredAdminLoginRequests();
    const req = list.find((r) => r.id === requestId) || null;
    callback(req);
  };

  checkCurrent();

  const handleUpdate = () => checkCurrent();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) handleUpdate();
    });
    window.addEventListener('ts_admin_request_change', handleUpdate);
  }

  const intervalId = setInterval(handleUpdate, 1200);

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('ts_admin_request_change', handleUpdate);
    }
    clearInterval(intervalId);
  };
};
