/**
 * Route guard for student profile pages.
 * Allows: logged-in student (cookie session) OR admin (sessionStorage).
 * Redirects everyone else to /join.
 */
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { type ReactNode } from "react";

const isAdminSession = (): boolean => {
  try {
    const raw = sessionStorage.getItem("ts_admin_session");
    if (!raw) return false;
    const s = JSON.parse(raw);
    return s.role === "super_admin" || s.role === "admin";
  } catch {
    return false;
  }
};

const ProtectedStudentRoute = ({ children }: { children: ReactNode }) => {
  const { session } = useStudentAuth();

  // Either a student cookie session OR an admin sessionStorage session is sufficient
  if (!session && !isAdminSession()) {
    return <Navigate to="/join" replace />;
  }

  return <>{children}</>;
};

export default ProtectedStudentRoute;
