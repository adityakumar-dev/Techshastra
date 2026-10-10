/**
 * Auth page — Admin login.
 *
 * Credentials: Name + Mobile + Date of Birth.
 * Session stored in sessionStorage (auto-clears on tab close).
 * First-login flow: if super admin credentials are still default,
 * prompt to set new ones before entering.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  verifyAdmin, setSuperAdminCredentials, isSuperAdminDefault, getAdminUsers,
  type AdminRole,
  createAdminLoginRequest,
  cancelAdminLoginRequest,
  subscribeToSpecificRequest,
  getClientDeviceString,
  type AdminLoginRequest,
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
  Clock, ShieldAlert, CheckCircle2, XCircle, ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AuthState = "login" | "checking" | "denied" | "blocked" | "setup" | "awaiting_approval" | "request_rejected";

const Auth = () => {
  const [authState, setAuthState] = useState<AuthState>(() =>
    isSuperAdminDefault() ? "setup" : "login"
  );
  const [loading, setLoading]     = useState(false);
  const [blockedName, setBlockedName] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<AdminLoginRequest | null>(null);

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

  // ── REALTIME APPROVAL LISTENER ──────────────────────────────────────
  useEffect(() => {
    if (authState !== "awaiting_approval" || !currentRequestId) return;

    const unsubscribe = subscribeToSpecificRequest(currentRequestId, async (req) => {
      if (!req) return;
      setActiveRequest(req);

      if (req.status === "approved") {
        // Super Admin confirmed the login!
        sessionStorage.setItem("ts_admin_session", JSON.stringify({
          userId: req.adminId,
          role: req.role,
          name: req.adminName,
          authenticated_at: new Date().toISOString(),
          approved_by: req.respondedBy || "Super Admin",
        }));

        try {
          await registerAdminSession(req.adminName, req.adminId, null);
          logAdminAction(
            req.adminId,
            req.adminName,
            req.role,
            `Logged into admin panel (Approved by ${req.respondedBy || "Super Admin"})`,
            "admin_sessions"
          ).catch(() => {});
        } catch (_err) {
          console.warn("Failed to register approved session:", _err);
        }

        toast({
          title: "Access Confirmed! ✓",
          description: `Super Admin confirmed your session. Welcome, ${req.adminName}.`,
        });

        navigate("/admin", { replace: true });
      } else if (req.status === "rejected") {
        setAuthState("request_rejected");
      } else if (req.status === "expired") {
        toast({
          title: "Request Expired",
          description: "Your login confirmation request timed out. Please try logging in again.",
          variant: "destructive",
        });
        setAuthState("login");
      }
    });

    return () => unsubscribe();
  }, [authState, currentRequestId, navigate, toast]);

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

    // If Super Admin, grant immediate one-time direct access
    if (result.role === "super_admin") {
      sessionStorage.setItem("ts_admin_session", JSON.stringify({
        userId: result.id,
        role: result.role,
        name: name.trim(),
        authenticated_at: new Date().toISOString(),
      }));

      try {
        await registerAdminSession(name.trim(), null, null);
        logAdminAction(
          result.id,
          name.trim(),
          result.role,
          "Super Admin logged into admin panel directly",
          "admin_sessions"
        ).catch(() => {});
      } catch (_err) {
        console.warn("Failed to register admin session in Supabase:", _err);
      }

      toast({ title: `Welcome, Super Admin` });
      navigate("/admin", { replace: true });
      setLoading(false);
      return;
    }

    // For regular admins: invoke confirmation flow for Super Admin
    const req = createAdminLoginRequest({
      adminId: result.id,
      adminName: name.trim(),
      mobile: mobile.trim(),
      dob,
      role: "admin",
      device: getClientDeviceString(),
    });

    setCurrentRequestId(req.id);
    setActiveRequest(req);
    setAuthState("awaiting_approval");
    setLoading(false);
    toast({
      title: "Confirmation Request Dispatched",
      description: "A confirmation prompt has been dispatched to the Super Admin for approval.",
    });
  };

  const handleCancelRequest = () => {
    if (currentRequestId) {
      cancelAdminLoginRequest(currentRequestId);
      setCurrentRequestId(null);
      setActiveRequest(null);
    }
    setAuthState("login");
    toast({ title: "Request Cancelled", description: "Login request has been withdrawn." });
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

  // Awaiting Super Admin Confirmation
  if (authState === "awaiting_approval") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-amber-500/5 p-4">
        <Card className="w-full max-w-md border-amber-500/30 shadow-xl shadow-amber-500/5 animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="text-center space-y-4">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-25"></span>
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center relative">
                <ShieldAlert className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Super Admin Approval Required</CardTitle>
              <CardDescription className="mt-1">
                Credentials verified. Please wait while the Super Admin confirms your login.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin Account:</span>
                <span className="font-semibold text-foreground">{name.trim()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Requested Role:</span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-medium">
                  Admin
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Device:</span>
                <span className="text-muted-foreground font-mono">{activeRequest?.device || getClientDeviceString()}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-500/10">
                <span className="text-muted-foreground">Live Status:</span>
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Awaiting Super Admin Decision...
                </span>
              </div>
              {activeRequest?.id && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/75">
                  <span>Request ID:</span>
                  <span className="font-mono">{activeRequest.id.slice(-8).toUpperCase()}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center px-2">
              Keep this tab open. Once the Super Admin clicks <strong className="text-foreground">Approve</strong> on their dashboard, you will be redirected automatically.
            </p>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                className="w-full gap-2 border-border/80 hover:bg-muted"
                onClick={handleCancelRequest}
              >
                <XCircle className="w-4 h-4 text-muted-foreground" />
                Cancel Login Request
              </Button>
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access Request Rejected
  if (authState === "request_rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <Card className="w-full max-w-md border-destructive/30 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-destructive">Access Request Rejected</CardTitle>
              <CardDescription className="mt-2">
                The Super Admin declined your login request. Access to the admin dashboard has not been granted.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAuthState("login");
                setName("");
                setMobile("");
                setDob("");
                setCurrentRequestId(null);
                setActiveRequest(null);
              }}
            >
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

  return null;
};

export default Auth;
