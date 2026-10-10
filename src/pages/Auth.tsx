/**
 * Auth page — Admin login.
 *
 * Credentials: Name + Mobile + Date of Birth.
 * Session stored in sessionStorage (auto-clears on tab close).
 * First-login flow: if super admin credentials are still default,
 * prompt to set new ones before entering.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  verifyAdmin, setSuperAdminCredentials, isSuperAdminDefault, getAdminUsers,
  type AdminRole,
} from "@/lib/adminStore";
import { registerAdminSession, logAdminAction } from "@/lib/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, ShieldCheck, Lock, AlertTriangle, KeyRound, RefreshCw,
} from "lucide-react";

type AuthState = "login" | "checking" | "denied" | "blocked" | "setup";

const Auth = () => {
  const [authState, setAuthState] = useState<AuthState>(() =>
    isSuperAdminDefault() ? "setup" : "login"
  );
  const [loading, setLoading]     = useState(false);
  const [blockedName, setBlockedName] = useState("");

  // Login form fields
  const [name, setName]     = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob]       = useState("");

  // Setup form fields
  const [setupName, setSetupName]     = useState("");
  const [setupMobile, setSetupMobile] = useState("");
  const [setupDob, setSetupDob]       = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  // ── LOGIN ───────────────────────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !dob) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setLoading(true);
    setAuthState("checking");
    // Ensure latest admin credentials from Supabase are synced
    await getAdminUsers();

    const result = verifyAdmin(name.trim(), mobile.trim(), dob);

    if (!result.success) {
      if (result.blocked) {
        setBlockedName(result.name);
        setAuthState("blocked");
      } else {
        setAuthState("denied");
      }
      setLoading(false);
      return;
    }

    sessionStorage.setItem("ts_admin_session", JSON.stringify({
      userId: result.id,
      role: result.role,
      name: name.trim(),
      authenticated_at: new Date().toISOString(),
    }));

    // Register active session in Supabase admin_sessions table
    try {
      await registerAdminSession(
        name.trim(),
        result.id === "super_admin" ? null : result.id,
        null
      );
      logAdminAction(
        result.id,
        name.trim(),
        result.role,
        "Logged into admin panel",
        "admin_sessions"
      ).catch(() => {});
    } catch (_err) {
      console.warn("Failed to register admin session in Supabase:", _err);
    }

    toast({ title: `Welcome, ${result.role === "super_admin" ? "Super Admin" : name.trim()}` });
    navigate("/admin", { replace: true });
    setLoading(false);
  };

  // ── FIRST-RUN SETUP ─────────────────────────────────────────────────

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim() || !setupMobile.trim() || !setupDob) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    const confirmKey = `${setupName.trim().toLowerCase()}${setupMobile.trim()}${setupDob}`;
    const confirmKey2 = `${setupConfirm.trim().toLowerCase()}`;
    // simple re-entry confirmation: just re-type name
    if (setupName.trim().toLowerCase() !== setupConfirm.trim().toLowerCase()) {
      toast({ title: "Name confirmation doesn't match", variant: "destructive" });
      return;
    }
    setSuperAdminCredentials(setupName.trim(), setupMobile.trim(), setupDob);
    toast({ title: "Super admin credentials set ✓", description: "You can now log in with your new credentials." });
    setAuthState("login");
  };

  // ── RENDER ─────────────────────────────────────────────────────────

  // First-run: set new super admin credentials
  if (authState === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">First-Time Setup</CardTitle>
              <CardDescription className="mt-1">
                Default credentials detected. Set your super admin credentials before proceeding.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={setupName} onChange={e => setSetupName(e.target.value)}
                  placeholder="Your full name" required autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={setupMobile} onChange={e => setSetupMobile(e.target.value)}
                  placeholder="10-digit mobile" required autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={setupDob} onChange={e => setSetupDob(e.target.value)}
                  required />
              </div>
              <div className="space-y-2">
                <Label>Confirm — Re-type your name</Label>
                <Input value={setupConfirm} onChange={e => setSetupConfirm(e.target.value)}
                  placeholder="Type your name again to confirm" required autoComplete="off" />
              </div>
              <Button type="submit" className="w-full">Set Credentials & Continue</Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground text-center">
              These replace the default credentials. Store them securely.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login form (also shown while checking)
  if (authState === "login" || authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">TECHSHASTRA Admin</CardTitle>
              <CardDescription className="mt-1">Authorized personnel only.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name</Label>
                <Input id="admin-name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="As registered" required disabled={authState === "checking"}
                  autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-mobile">Mobile Number</Label>
                <Input id="admin-mobile" value={mobile} onChange={e => setMobile(e.target.value)}
                  placeholder="Registered mobile" required disabled={authState === "checking"}
                  autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-dob">Date of Birth</Label>
                <Input id="admin-dob" type="date" value={dob} onChange={e => setDob(e.target.value)}
                  required disabled={authState === "checking"} />
              </div>
              <Button type="submit" className="w-full" disabled={loading || authState === "checking"}>
                {(loading || authState === "checking") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {authState === "checking" ? "Verifying…" : "Access Admin Panel"}
              </Button>
            </form>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Session expires when you close the tab.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access Denied
  if (authState === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <Card className="w-full max-w-md border-destructive/30">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
              <CardDescription className="mt-2">
                Invalid credentials. Contact the Super Admin if you need access.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full"
              onClick={() => { setAuthState("login"); setName(""); setMobile(""); setDob(""); }}>
              Try Again
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Blocked
  if (authState === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <Card className="w-full max-w-md border-destructive/30">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-destructive">Account Blocked</CardTitle>
              <CardDescription className="mt-2">
                {blockedName ? `${blockedName}, your` : "Your"} admin access has been revoked by the
                Super Admin. Contact the President directly if you believe this is an error.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Auth;
