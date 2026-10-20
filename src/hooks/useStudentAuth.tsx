/**
 * StudentAuth context + hook.
 * Wraps cookie-based student session so any component can read/update it.
 */
// eslint-disable-next-line react-refresh/only-export-components
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  getStudentSession,
  signInStudent,
  signOutStudent,
  type StudentSession,
} from "@/lib/studentStore";
import { signInStudentRemote, getStudentByUserId } from "@/lib/services/studentService";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

interface StudentAuthContextValue {
  session: StudentSession | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Re-read cookie (call after profile edits that don't change session fields) */
  refresh: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextValue | null>(null);

export const StudentAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<StudentSession | null>(() =>
    getStudentSession()
  );

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Supabase Auth is the single source of truth for production.
    // The local-store fallback has been intentionally removed —
    // deleting a user from Supabase must fully revoke their access.
    if (!isSupabaseConfigured()) return false;

    try {
      const remote = await signInStudentRemote(email, password);
      if (remote) {
        const sName = remote.student?.name || remote.user.user_metadata?.full_name || email;
        let sGh = remote.student?.githubUsername || (remote.student as any)?.github_username || remote.user.user_metadata?.github_username || "";
        
        // If sGh is empty, direct fallback check on student_profiles table
        if (!sGh) {
          try {
            const { data: sp }: any = await (supabase
              .from('student_profiles' as any)
              .select('github_username, username')
              .eq('user_id', remote.user.id)
              .maybeSingle() as any);
            if (sp) sGh = sp.github_username || sp.username || "";
          } catch (_e) {}
        }

        const newSession: StudentSession = {
          studentId: remote.student?.id || remote.user.id,
          githubUsername: sGh,
          name: sName,
          authenticated_at: new Date().toISOString(),
        };
        document.cookie = `ts_student_session=${encodeURIComponent(JSON.stringify(newSession))}; max-age=${7 * 86400}; path=/; SameSite=Lax`;
        setSession(newSession);
        return true;
      }
    } catch (_err) {
      console.warn("Supabase sign-in failed:", _err);
    }
    return false;
  }, []);


  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (_e) {}
    signOutStudent();
    setSession(null);
  }, []);

  const refresh = useCallback(() => {
    setSession(getStudentSession());
  }, []);

  // Listen to Supabase auth events (token refresh, cross-tab login/logout)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === 'SIGNED_OUT') {
        signOutStudent();
        setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (authSession?.user) {
          const current = getStudentSession();
          if (!current || current.studentId !== authSession.user.id || !current.githubUsername) {
            const student = await getStudentByUserId(authSession.user.id);
            const sName = student?.name || authSession.user.user_metadata?.full_name || authSession.user.email || '';
            let sGh = student?.githubUsername || (student as any)?.github_username || authSession.user.user_metadata?.github_username || '';
            
            if (!sGh) {
              try {
                const { data: sp }: any = await (supabase
                  .from('student_profiles' as any)
                  .select('github_username, username')
                  .eq('user_id', authSession.user.id)
                  .maybeSingle() as any);
                if (sp) sGh = sp.github_username || sp.username || '';
              } catch (_e) {}
            }

            const newSession: StudentSession = {
              studentId: student?.id || authSession.user.id,
              githubUsername: sGh,
              name: sName,
              authenticated_at: new Date().toISOString(),
            };
            document.cookie = `ts_student_session=${encodeURIComponent(JSON.stringify(newSession))}; max-age=${7 * 86400}; path=/; SameSite=Lax`;
            setSession(newSession);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // On mount: validate stored cookie session against Supabase.
  // 1. If user deleted in Supabase, clear cookie.
  // 2. If cookie exists but lacks githubUsername, self-heal immediately.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const cookieSession = getStudentSession();
    if (!cookieSession) return; // No local session, nothing to validate

    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) {
        // Supabase has no active session — cookie is orphaned, clear it
        signOutStudent();
        setSession(null);
      } else if (!cookieSession.githubUsername && authSession.user) {
        // Self-heal: recover missing githubUsername from student_profiles or user_metadata
        let sGh = authSession.user.user_metadata?.github_username || "";
        if (!sGh) {
          try {
            const { data: sp } = await supabase
              .from('student_profiles')
              .select('github_username, username')
              .eq('user_id', authSession.user.id)
              .maybeSingle();
            if (sp) sGh = sp.github_username || sp.username || "";
          } catch (_e) {}
        }

        if (sGh) {
          const updatedSession: StudentSession = {
            ...cookieSession,
            githubUsername: sGh,
          };
          document.cookie = `ts_student_session=${encodeURIComponent(JSON.stringify(updatedSession))}; max-age=${7 * 86400}; path=/; SameSite=Lax`;
          setSession(updatedSession);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StudentAuthContext.Provider value={{ session, login, logout, refresh }}>
      {children}
    </StudentAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStudentAuth = (): StudentAuthContextValue => {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error("useStudentAuth must be inside StudentAuthProvider");
  return ctx;
};
