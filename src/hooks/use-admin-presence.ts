import { useState, useEffect } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────
export interface AdminPresence {
    user_id: string;
    full_name: string;
    current_tab: string;
    joined_at: string;
    last_action: string;
    last_action_at: string;
}

export interface ActivityLogEntry {
    id: string;
    user_id: string;
    full_name: string;
    action: string;
    tab: string;
    timestamp: string;
    is_login?: boolean;
    is_logout?: boolean;
}

const ACTIVITY_LOG_KEY = "ts_activity_log";

// ─── SIMPLIFIED PRESENCE HOOK (localStorage-based) ───────────────────
/**
 * Simplified admin presence tracking using localStorage
 * Note: This works per-browser, not cross-device like Supabase Realtime
 */
export function useAdminPresence(
    userId: string | null,
    fullName: string,
    currentTab: string
) {
    const [onlineAdmins, setOnlineAdmins] = useState<AdminPresence[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

    // Load activity log from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
        if (stored) {
            try {
                const logs: ActivityLogEntry[] = JSON.parse(stored);
                setActivityLog(logs.slice(0, 100)); // Keep last 100
            } catch (e) {
                console.error("Failed to parse activity log", e);
            }
        }
    }, []);

    // Add log entry helper
    const addLog = (entry: Omit<ActivityLogEntry, "id">) => {
        const newEntry: ActivityLogEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };

        setActivityLog((prev) => {
            const updated = [newEntry, ...prev.slice(0, 99)];
            localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    // Track current admin's presence (single session only)
    useEffect(() => {
        if (!userId || !fullName) return;

        const presence: AdminPresence = {
            user_id: userId,
            full_name: fullName,
            current_tab: currentTab,
            joined_at: new Date().toISOString(),
            last_action: "Viewing admin panel",
            last_action_at: new Date().toISOString(),
        };

        setOnlineAdmins([presence]);

        // Log login
        addLog({
            user_id: userId,
            full_name: fullName,
            action: "Logged in",
            tab: currentTab,
            timestamp: new Date().toISOString(),
            is_login: true,
        });

        // Cleanup on unmount
        return () => {
            addLog({
                user_id: userId,
                full_name: fullName,
                action: "Logged out",
                tab: currentTab,
                timestamp: new Date().toISOString(),
                is_logout: true,
            });
        };
    }, [userId, fullName]);

    // Update presence when tab changes
    useEffect(() => {
        if (!userId || !fullName) return;

        setOnlineAdmins((prev) =>
            prev.map((admin) =>
                admin.user_id === userId
                    ? {
                          ...admin,
                          current_tab: currentTab,
                          last_action: `Switched to ${currentTab}`,
                          last_action_at: new Date().toISOString(),
                      }
                    : admin
            )
        );

        addLog({
            user_id: userId,
            full_name: fullName,
            action: `Switched to ${currentTab}`,
            tab: currentTab,
            timestamp: new Date().toISOString(),
        });
    }, [currentTab]);

    // Broadcast action (logs it)
    const broadcastAction = (action: string) => {
        if (!userId || !fullName) return;

        setOnlineAdmins((prev) =>
            prev.map((admin) =>
                admin.user_id === userId
                    ? {
                          ...admin,
                          last_action: action,
                          last_action_at: new Date().toISOString(),
                      }
                    : admin
            )
        );

        addLog({
            user_id: userId,
            full_name: fullName,
            action,
            tab: currentTab,
            timestamp: new Date().toISOString(),
        });
    };

    // Revert action — marks entry as reverted in both state and localStorage
    const revertAction = async (entryId: string) => {
        setActivityLog((prev) => {
            const updated = prev.map((log) =>
                log.id === entryId
                    ? { ...log, action: `[REVERTED] ${log.action}` }
                    : log
            );
            // Write the updated value from the callback (not stale closure)
            localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    return {
        onlineAdmins,
        activityLog,
        broadcastAction,
        revertAction,
    };
}
