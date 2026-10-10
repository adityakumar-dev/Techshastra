import { AdminCredential, getStoredCredentials, setPageVisibility } from "./adminStore";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type LogEntryType =
    | "create_credential"
    | "delete_credential"
    | "block_credential"
    | "unblock_credential"
    | "toggle_page";

export interface LogEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    type: LogEntryType;
    revertible: boolean;
    credentialSnapshot?: AdminCredential;
    credentialId?: string;
    pageId?: string;
    pageName?: string;
    pagePath?: string;
    isVisible?: boolean;     // the NEW state after the toggle (revert sets it back to !isVisible)
}

const LOG_KEY = "ts_super_admin_log";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const getLogEntries = (): LogEntry[] => {
    try {
        const raw = localStorage.getItem(LOG_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveLogEntries = (entries: LogEntry[]) => {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
};

import { logAdminAction } from "./services/adminService";

export const addLogEntry = (entry: Omit<LogEntry, "id" | "timestamp">): LogEntry => {
    const full: LogEntry = {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
    };
    const existing = getLogEntries();
    saveLogEntries([full, ...existing]);

    // Persist to Supabase audit_logs table
    logAdminAction(
        entry.credentialId || null,
        entry.actor,
        "super_admin",
        entry.action,
        entry.type,
        entry.credentialId || entry.pageId || null,
        entry
    ).catch((e) => console.warn("Failed to persist audit log to Supabase:", e));

    return full;
};

export const clearLog = () => {
    localStorage.removeItem(LOG_KEY);
};

// ─── REVERT ───────────────────────────────────────────────────────────────────

export const revertEntry = (
    entryId: string,
    saveCredentials: (creds: AdminCredential[]) => void
): { success: boolean; message: string } => {
    const entries = getLogEntries();
    const entry = entries.find((e) => e.id === entryId);

    if (!entry) return { success: false, message: "Log entry not found." };
    if (!entry.revertible) return { success: false, message: "This action cannot be reverted." };

    const creds = getStoredCredentials();

    switch (entry.type) {
        case "delete_credential": {
            if (!entry.credentialSnapshot) return { success: false, message: "No snapshot to restore." };
            if (creds.some((c) => c.id === entry.credentialSnapshot!.id)) {
                return { success: false, message: "Credential already exists." };
            }
            saveCredentials([...creds, entry.credentialSnapshot]);
            addLogEntry({
                actor: entry.actor,
                action: `↩️ Reverted deletion of ${entry.credentialSnapshot.name}'s credentials`,
                type: "create_credential",
                revertible: false,
                credentialSnapshot: entry.credentialSnapshot,
            });
            return { success: true, message: `Restored credentials for ${entry.credentialSnapshot.name}.` };
        }

        case "create_credential": {
            if (!entry.credentialSnapshot) return { success: false, message: "No snapshot available." };
            saveCredentials(creds.filter((c) => c.id !== entry.credentialSnapshot!.id));
            addLogEntry({
                actor: entry.actor,
                action: `↩️ Reverted creation of ${entry.credentialSnapshot.name}'s credentials`,
                type: "delete_credential",
                revertible: false,
                credentialId: entry.credentialSnapshot.id,
            });
            return { success: true, message: `Removed credentials for ${entry.credentialSnapshot.name}.` };
        }

        case "block_credential": {
            const id = entry.credentialId;
            if (!id) return { success: false, message: "No credential ID to unblock." };
            const updated = creds.map((c) => (c.id === id ? { ...c, is_blocked: false } : c));
            saveCredentials(updated);
            addLogEntry({
                actor: entry.actor,
                action: `↩️ Reverted block on ${creds.find(c => c.id === id)?.name ?? id}`,
                type: "unblock_credential",
                revertible: false,
                credentialId: id,
            });
            return { success: true, message: `Unblocked ${creds.find(c => c.id === id)?.name ?? id}.` };
        }

        case "unblock_credential": {
            const id = entry.credentialId;
            if (!id) return { success: false, message: "No credential ID to block." };
            const updated = creds.map((c) => (c.id === id ? { ...c, is_blocked: true } : c));
            saveCredentials(updated);
            addLogEntry({
                actor: entry.actor,
                action: `↩️ Reverted unblock on ${creds.find(c => c.id === id)?.name ?? id}`,
                type: "block_credential",
                revertible: false,
                credentialId: id,
            });
            return { success: true, message: `Re-blocked ${creds.find(c => c.id === id)?.name ?? id}.` };
        }

        case "toggle_page": {
            // isVisible is the state AFTER the toggle — revert means setting it back to !isVisible
            const { pageId, pageName, isVisible } = entry;
            if (!pageId) return { success: false, message: "No page ID in log entry." };
            const targetVisibility = !isVisible;
            // Fire-and-forget async; setPageVisibility is sync under the hood
            setPageVisibility(pageId, targetVisibility).catch(() => {});
            addLogEntry({
                actor: entry.actor,
                action: `↩️ Reverted "${pageName ?? pageId}" visibility → ${targetVisibility ? "visible" : "hidden"}`,
                type: "toggle_page",
                revertible: false,
                pageId,
                pageName,
                isVisible: targetVisibility,
            });
            return { success: true, message: `"${pageName ?? pageId}" set to ${targetVisibility ? "visible" : "hidden"}.` };
        }

        default:
            return { success: false, message: "Revert not supported for this action type." };
    }
};

// ─── SAVE HELPER (used by revertEntry callers in Admin.tsx) ──────────────────
export const saveCredentialsRaw = (creds: AdminCredential[]) => {
    localStorage.setItem("ts_admin_credentials", JSON.stringify(creds));
};
