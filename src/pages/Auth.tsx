import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  verifyAdmin,
  getAdminUsers,
  type AdminCredential,
  createAdminLoginRequest,
  getClientDeviceString,
} from "@/lib/adminStore";
import {
  registerAdminSession,
  logAdminAction,
  checkPendingRegistrationByMobileDB,
  getRequestStatusByMobileDB,
} from "@/lib/services/adminService";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  UserPlus,
  LogIn,
  Search,
  Building,
  ExternalLink,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AuthTab = "signin" | "register" | "status";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [loading, setLoading] = useState(false);

  // Sign In State
  const [signInName, setSignInName] = useState("");
  const [signInMobile, setSignInMobile] = useState("");
  const [signInDob, setSignInDob] = useState("");
  const [blockedAccount, setBlockedAccount] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDepartment, setRegDepartment] = useState("");

  // Submitted Confirmation State
  const [submittedRequest, setSubmittedRequest] = useState<{
    id: string;
    name: string;
    mobile: string;
    date: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Status Lookup State
  const [statusMobile, setStatusMobile] = useState("");
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    status?: "pending" | "approved" | "rejected";
    name?: string;
    requestedAt?: string;
    respondedAt?: string;
  } | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Auto-redirect countdown effect after request submission ───────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate("/", { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  // ── 1. HANDLE SIGN IN ─────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInName.trim() || !signInMobile.trim() || !signInDob) {
      toast({ title: "All credentials required", variant: "destructive" });
      return;
    }

    setLoading(true);
    setBlockedAccount(null);

    try {
      // 1. Sync credentials from Supabase
      let remoteCreds: AdminCredential[] = [];
      try {
        remoteCreds = await getAdminUsers();
      } catch (_e) {}

      let result = verifyAdmin(signInName.trim(), signInMobile.trim(), signInDob, remoteCreds);

      // Direct Supabase fallback
      if (!result.success && isSupabaseConfigured()) {
        try {
          const { data: dbCreds } = await supabase.from("admin_credentials").select("*").limit(50);
          if (dbCreds && dbCreds.length > 0) {
            const mapped: AdminCredential[] = dbCreds.map((r: any) => ({
              id: r.id,
              name: r.name,
              mobile: r.mobile,
              dob: r.dob,
              email: r.email || undefined,
              role: r.role as any,
              is_blocked: r.is_blocked,
              created_at: r.created_at,
            }));
            result = verifyAdmin(signInName.trim(), signInMobile.trim(), signInDob, mapped);
          }
        } catch (_dbErr) {}
      }

      // Check result
      if (result.success) {
        // Successful login!
        sessionStorage.setItem(
          "ts_admin_session",
          JSON.stringify({
            userId: result.id,
            role: result.role,
            name: signInName.trim(),
            authenticated_at: new Date().toISOString(),
          })
        );

        await registerAdminSession(signInName.trim(), result.id, null).catch(() => {});
        logAdminAction(
          result.id,
          signInName.trim(),
          result.role,
          "Logged into admin panel",
          "admin_sessions"
        ).catch(() => {});

        toast({
          title: "Welcome Back! ✓",
          description: `Successfully signed in as ${signInName.trim()}.`,
        });

        navigate("/admin", { replace: true });
        return;
      }

      // Account is blocked
      if (result.blocked) {
        setBlockedAccount(result.name || signInName.trim());
        setLoading(false);
        return;
      }

      // Not found — Check if a pending registration request exists
      const pendingReq = await checkPendingRegistrationByMobileDB(signInMobile.trim());
      if (pendingReq) {
        toast({
          title: "Registration Pending Review",
          description: `Your access request submitted on ${new Date(
            pendingReq.requested_at
          ).toLocaleDateString()} is waiting for Super Admin approval.`,
        });
      } else {
        toast({
          title: "Account Not Found",
          description: "No admin account matches these credentials. If you are new, please use the 'Request Admin Access' tab.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Login Error",
        description: err.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── 2. HANDLE REQUEST ACCESS (REGISTRATION) ───────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regMobile.trim() || !regDob) {
      toast({ title: "Name, Mobile, and Date of Birth are required", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user already has an approved account
      const remoteCreds = await getAdminUsers().catch(() => []);
      const alreadyApproved = remoteCreds.find(
        (c) =>
          c.mobile.replace(/[^0-9]/g, "").slice(-10) ===
          regMobile.replace(/[^0-9]/g, "").slice(-10)
      );

      if (alreadyApproved) {
        toast({
          title: "Account Already Exists",
          description: "An admin account is already registered with this mobile number. Please use the Sign In tab.",
        });
        setActiveTab("signin");
        setSignInMobile(regMobile);
        setSignInName(alreadyApproved.name);
        setLoading(false);
        return;
      }

      // 2. Check if a request is already pending
      const existingPending = await checkPendingRegistrationByMobileDB(regMobile.trim());
      if (existingPending) {
        toast({
          title: "Request Already Submitted",
          description: `A request for this mobile is already pending Super Admin approval. Submitted on ${new Date(
            existingPending.requested_at
          ).toLocaleDateString()}.`,
        });
        setActiveTab("status");
        setStatusMobile(regMobile);
        setLoading(false);
        return;
      }

      // 3. Dispatch the new admin registration request
      const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const req = createAdminLoginRequest({
        adminId: regId,
        adminName: regName.trim(),
        mobile: regMobile.trim(),
        dob: regDob,
        role: "admin",
        device: `${getClientDeviceString()}${regDepartment ? ` [${regDepartment}]` : ""}`,
        isNewRegistration: true,
      });

      // Show confirmation screen instead of blocking loader
      setSubmittedRequest({
        id: req.id,
        name: regName.trim(),
        mobile: regMobile.trim(),
        date: new Date().toLocaleDateString(),
      });
      setCountdown(12); // 12-second gentle auto redirect

      toast({
        title: "Request Submitted Successfully! 🎉",
        description: "Your admin registration request has been forwarded to the Super Admin.",
      });
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err.message || "Failed to submit request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── 3. HANDLE STATUS LOOKUP ───────────────────────────────────────────────
  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusMobile.trim()) {
      toast({ title: "Please enter your mobile number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const record = await getRequestStatusByMobileDB(statusMobile.trim());
      if (record) {
        setStatusResult({
          found: true,
          status: record.status as any,
          name: record.admin_name,
          requestedAt: record.requested_at,
          respondedAt: record.responded_at || undefined,
        });
      } else {
        // Also check if they are already in admin_credentials
        const remoteCreds = await getAdminUsers().catch(() => []);
        const matched = remoteCreds.find(
          (c) =>
            c.mobile.replace(/[^0-9]/g, "").slice(-10) ===
            statusMobile.replace(/[^0-9]/g, "").slice(-10)
        );

        if (matched) {
          setStatusResult({
            found: true,
            status: "approved",
            name: matched.name,
          });
        } else {
          setStatusResult({ found: false });
        }
      }
    } catch (_err) {
      setStatusResult({ found: false });
    } finally {
      setLoading(false);
    }
  };

  // ── 4. RENDER SUCCESSFUL SUBMISSION CONFIRMATION ───────────────────────────
  if (submittedRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-emerald-500/5 p-4">
        <Card className="w-full max-w-lg border-emerald-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-2">
                <Sparkles className="w-3 h-3" /> Application Received
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Access Request Submitted!</CardTitle>
              <CardDescription className="text-xs max-w-md mx-auto mt-1">
                Your request to join the TECHSHASTRA Admin Panel has been delivered to the Super Admin.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Friendly Informative Notice */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-foreground space-y-2">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4" /> Next Steps:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Approvals are reviewed manually by the Super Admin, so you do not need to wait on this screen.
                Once approved, you will be able to access the admin account directly by signing in with your registered Name, Mobile, and Date of Birth.
              </p>
            </div>

            {/* Reference Details */}
            <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Applicant:</span>
                <span className="font-semibold text-foreground">{submittedRequest.name}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Mobile:</span>
                <span className="font-mono text-foreground">{submittedRequest.mobile}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Request ID:</span>
                <span className="font-mono text-foreground">
                  #{submittedRequest.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Status:</span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                  Pending Review
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                onClick={() => navigate("/")}
              >
                Return to TechShastra Homepage
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={() => {
                  setSubmittedRequest(null);
                  setCountdown(null);
                  setActiveTab("signin");
                }}
              >
                Back to Admin Sign In
              </Button>
            </div>

            {countdown !== null && (
              <p className="text-[11px] text-muted-foreground text-center">
                Automatically returning to homepage in {countdown}s...{" "}
                <button
                  onClick={() => setCountdown(null)}
                  className="text-primary underline hover:text-primary/80"
                >
                  Stay here
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── 5. RENDER MAIN AUTH TABS PORTAL ───────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5 animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="text-center space-y-1.5 pb-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">TECHSHASTRA Admin Portal</CardTitle>
          <CardDescription className="text-xs">
            Sign in to access your administrative dashboard or request new admin clearance.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {blockedAccount && (
            <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Account Suspended
              </p>
              <p>
                Access for <strong>{blockedAccount}</strong> has been suspended by the Super Admin. Please contact leadership to reactivate.
              </p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AuthTab)} className="space-y-4">
            <TabsList className="grid grid-cols-3 bg-muted/60 p-1 border border-border/60">
              <TabsTrigger value="signin" className="text-xs gap-1.5">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="text-xs gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Request Access
              </TabsTrigger>
              <TabsTrigger value="status" className="text-xs gap-1.5">
                <Search className="w-3.5 h-3.5" /> Track Status
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: ADMIN SIGN IN ── */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    value={signInName}
                    onChange={(e) => setSignInName(e.target.value)}
                    placeholder="Registered Name"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input
                    value={signInMobile}
                    onChange={(e) => setSignInMobile(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="10-digit Mobile"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Date of Birth</Label>
                  <Input
                    type="date"
                    value={signInDob}
                    onChange={(e) => setSignInDob(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2 font-medium" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Sign In to Admin Panel
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ── TAB 2: REQUEST ACCESS (REGISTRATION) ── */}
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-muted-foreground">
                  New member or lead? Fill in your details below. Once approved by the Super Admin, your account will be activated.
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Mobile Number</Label>
                    <Input
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="10-digit number"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date of Birth</Label>
                    <Input
                      type="date"
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Email Address (Optional)</Label>
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Department / Club Role (Optional)</Label>
                  <Input
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="e.g. Technical Lead / Events Core"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Request...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Submit Access Request
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ── TAB 3: TRACK REQUEST STATUS ── */}
            <TabsContent value="status">
              <form onSubmit={handleCheckStatus} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Enter Registered Mobile</Label>
                  <Input
                    value={statusMobile}
                    onChange={(e) => setStatusMobile(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="10-digit Mobile Number"
                    maxLength={10}
                    required
                  />
                </div>

                <Button type="submit" variant="secondary" className="w-full gap-2 text-xs" disabled={loading}>
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Check Request Status
                </Button>

                {statusResult && (
                  <div className="p-3.5 rounded-lg border text-xs space-y-2 mt-3 animate-in fade-in duration-200">
                    {statusResult.found ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{statusResult.name}</span>
                          {statusResult.status === "approved" && (
                            <Badge className="bg-emerald-600 text-white text-[10px]">Approved ✓</Badge>
                          )}
                          {statusResult.status === "pending" && (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-[10px]">
                              Under Review
                            </Badge>
                          )}
                          {statusResult.status === "rejected" && (
                            <Badge variant="destructive" className="text-[10px]">Declined</Badge>
                          )}
                        </div>

                        {statusResult.status === "approved" && (
                          <div className="space-y-2">
                            <p className="text-muted-foreground">
                              🎉 Your admin account is active! You can now sign in using your credentials.
                            </p>
                            <Button
                              size="sm"
                              className="w-full text-xs h-8"
                              onClick={() => {
                                setActiveTab("signin");
                                setSignInMobile(statusMobile);
                              }}
                            >
                              Go to Sign In
                            </Button>
                          </div>
                        )}

                        {statusResult.status === "pending" && (
                          <p className="text-muted-foreground">
                            ⏳ Your request is currently waiting for Super Admin review. Please check back later or await approval.
                          </p>
                        )}

                        {statusResult.status === "rejected" && (
                          <p className="text-destructive">
                            Your access request was declined. Please speak with the Super Admin for details.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center">
                        No request found for this mobile number. You can submit one in the "Request Access" tab.
                      </p>
                    )}
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>

          {/* Bottom Security / Navigation Footer */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> TechShastra Home
            </Link>

            <Link
              to="/superadmin"
              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500 hover:underline font-medium"
            >
              <Shield className="w-3.5 h-3.5" /> Super Admin Portal →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
