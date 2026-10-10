/**
 * ProtectedRoute — guards admin-only pages.
 *
 * Reads ts_admin_session from sessionStorage.
 * Adds a 30-minute idle timeout: after 25 min of inactivity a warning banner
 * appears; after 30 min the session is cleared and the user is redirected to /auth.
 * Any mouse/key/touch event resets the idle timer.
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { type AdminRole } from "@/lib/adminStore";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const IDLE_WARN_MS  = 25 * 60 * 1000;  // 25 min → show warning
const IDLE_LIMIT_MS = 30 * 60 * 1000;  // 30 min → force logout

interface ProtectedRouteProps {
  children: React.ReactNode | ((props: { userRole: AdminRole }) => React.ReactNode);
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [loading, setLoading]   = useState(true);
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [showWarn, setShowWarn] = useState(false);
  const navigate = useNavigate();

  const warnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLogout = useCallback(() => {
    sessionStorage.removeItem("ts_admin_session");
    navigate("/auth", { replace: true });
  }, [navigate]);

  const resetIdle = useCallback(() => {
    setShowWarn(false);
    if (warnTimer.current)  clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    warnTimer.current  = setTimeout(() => setShowWarn(true),  IDLE_WARN_MS);
    logoutTimer.current = setTimeout(doLogout,                 IDLE_LIMIT_MS);
  }, [doLogout]);

  useEffect(() => {
    // Read session
    const raw = sessionStorage.getItem("ts_admin_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.role === "super_admin" || session.role === "admin") {
          setUserRole(session.role as AdminRole);
        }
      } catch (_e) { /* invalid */ }
    }
    setLoading(false);
  }, []);

  // Start idle timers once authenticated
  useEffect(() => {
    if (!userRole) return;
    resetIdle();
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(ev => window.addEventListener(ev, resetIdle, { passive: true }));
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdle));
      if (warnTimer.current)  clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [userRole, resetIdle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userRole) return <Navigate to="/auth" replace />;
  if (requireAdmin && !userRole) return <Navigate to="/auth" replace />;

  return (
    <>
      {/* Idle warning banner */}
      {showWarn && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-6 py-3 bg-amber-500 text-amber-950 text-sm font-medium shadow-lg">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Your session will expire in 5 minutes due to inactivity.
          </span>
          <Button size="sm" variant="outline"
            className="border-amber-800 text-amber-950 hover:bg-amber-600 h-7 text-xs"
            onClick={resetIdle}>
            Stay Logged In
          </Button>
        </div>
      )}

      {typeof children === "function" && userRole
        ? <>{children({ userRole })}</>
        : <>{children}</>
      }
    </>
  );
};

export default ProtectedRoute;
