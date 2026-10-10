import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Download, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { verifyCertificateById } from "@/lib/services/certificateService";

interface VerifiedCertData {
  verification_id: string;
  recipient_name: string;
  event_name: string;
  issue_date: string;
  status: "active" | "revoked" | "expired";
  certificate_url: string | null;
}

const CertificateVerify = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<VerifiedCertData | null>(null);

  useEffect(() => {
    const fetchCert = async () => {
      if (!certificateId) {
        setLoading(false);
        return;
      }
      try {
        const data = await verifyCertificateById(certificateId);
        setCert(data as VerifiedCertData);
      } catch (e) {
        console.error("Verification failed:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {loading ? (
            <Card className="glass border-primary/20 text-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground font-light">Verifying credentials against official registry...</p>
            </Card>
          ) : !cert ? (
            <Card className="glass border-destructive/30 text-center p-8 md:p-12">
              <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
                <XCircle size={36} />
              </div>
              <CardTitle className="text-2xl font-heading mb-2 text-foreground">
                Certificate Not Found
              </CardTitle>
              <CardDescription className="text-muted-foreground max-w-md mx-auto mb-6">
                No certificate matching reference code <code className="text-foreground font-mono bg-muted/40 px-2 py-1 rounded">{certificateId}</code> was found in the official TECHSHASTRA credentials registry.
              </CardDescription>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>
              </Button>
            </Card>
          ) : (
            <Card className="glass border-primary/20 shadow-2xl relative overflow-hidden">
              {/* Header Banner */}
              <div className={`py-3 px-6 text-center text-xs tracking-widest uppercase font-semibold flex items-center justify-center gap-2 ${
                cert.status === "active"
                  ? "bg-green-500/10 text-green-500 border-b border-green-500/20"
                  : cert.status === "revoked"
                  ? "bg-destructive/10 text-destructive border-b border-destructive/20"
                  : "bg-amber-500/10 text-amber-500 border-b border-amber-500/20"
              }`}>
                {cert.status === "active" && <CheckCircle2 size={16} />}
                {cert.status === "revoked" && <XCircle size={16} />}
                {cert.status === "expired" && <AlertTriangle size={16} />}
                Official Credential Status: {cert.status.toUpperCase()}
              </div>

              <CardHeader className="text-center pt-8 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/20">
                  <ShieldCheck size={32} />
                </div>
                <CardTitle className="text-3xl font-heading font-light tracking-wide text-foreground">
                  Certificate Verification
                </CardTitle>
                <CardDescription className="text-xs uppercase tracking-widest text-primary/70">
                  Issued by TECHSHASTRA · UTU Dehradun
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-6 md:px-10 pb-10">
                <div className="glass rounded-2xl p-6 space-y-4 border border-border/40">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-border/30 gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-light">Recipient Name</span>
                    <span className="text-lg font-medium text-foreground">{cert.recipient_name}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-border/30 gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-light">Event / Program</span>
                    <span className="text-base text-foreground font-light">{cert.event_name}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-border/30 gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-light">Credential ID</span>
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md tracking-wider">
                      {cert.verification_id}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-border/30 gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-light">Issue Date</span>
                    <span className="text-sm text-foreground font-light">
                      {new Date(cert.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-light">Issuing Organization</span>
                    <span className="text-sm text-foreground font-light">Uttarakhand Technical University (UTU)</span>
                  </div>
                </div>

                {cert.certificate_url && (
                  <div className="pt-2 flex justify-center">
                    <Button asChild className="rounded-full gap-2 px-8">
                      <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                        <Download size={16} /> View Official Certificate File
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CertificateVerify;
