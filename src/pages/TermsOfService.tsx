import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, FileCheck, AlertTriangle, Terminal, Code2, Award, ShieldCheck, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TermsOfService = () => {
  const lastUpdated = "October 10, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-widest">
              <Scale className="w-3.5 h-3.5" /> Terms &amp; Conditions
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-light tracking-tight">
              Terms of <span className="text-primary italic">Service</span>
            </h1>
            <p className="text-foreground/50 text-sm max-w-xl mx-auto font-light">
              Official rules and guidelines governing the use of the TECHSHASTRA technical portal and student services.
            </p>
            <p className="text-xs text-foreground/40 font-mono">
              Effective Date: {lastUpdated}
            </p>
          </div>

          {/* Quick Notice */}
          <Card className="glass border-primary/20 rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3 text-primary font-medium text-base">
                <FileCheck className="w-5 h-5 flex-shrink-0" />
                <span>Agreement to Terms</span>
              </div>
              <p className="text-sm text-foreground/70 font-light leading-relaxed">
                By accessing TECHSHASTRA (techshastra.vercel.app or affiliated university domains), creating a student account, or submitting technical materials, you agree to comply with and be bound by these Terms of Service and our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-10 text-sm font-light leading-relaxed text-foreground/80">
            {/* Section 1 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">01.</span> Eligibility &amp; Account Responsibility
              </h2>
              <p>
                Student membership accounts on TECHSHASTRA are designated for enrolled students, alumni, faculty, and affiliated research partners of Uttarakhand Technical University (UTU) and recognized academic institutions.
              </p>
              <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
                <li>You agree to provide true, accurate, and current academic information during sign-up.</li>
                <li>You are solely responsible for maintaining the confidentiality of your account credentials.</li>
                <li>Accounts found using deceptive identity markers, fraudulent university roll numbers, or impersonating other individuals will be blocked immediately.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">02.</span> Live Sandbox &amp; Code Execution Policy
              </h2>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  TECHSHASTRA provides in-browser code execution environments (StackBlitz WebContainers and Pyodide WebAssembly). Abuse of these sandboxes is strictly prohibited.
                </p>
              </div>
              <p>You agree NOT to use our live code runners to:</p>
              <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
                <li>Mine cryptocurrencies or perform unauthorized distributed computing jobs.</li>
                <li>Execute malware, ransomware, keyloggers, network port scanners, or malicious payloads.</li>
                <li>Launch Denial-of-Service (DoS) attacks or bombard external APIs and university servers.</li>
                <li>Exfiltrate unauthorized personal data or bypass browser sandboxing controls.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">03.</span> Intellectual Property &amp; Project Ownership
              </h2>
              <p>
                We believe in developer ownership:
              </p>
              <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
                <li>
                  <strong className="text-foreground font-medium">Student Projects:</strong> Students retain full copyright and intellectual property rights over the software, hardware models, research publications, and repositories they submit to TECHSHASTRA.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Club Display License:</strong> By publishing your project or paper on our platform, you grant TECHSHASTRA a non-exclusive, royalty-free license to display, index, and showcase your project for academic, non-commercial, and promotional purposes.
                </li>
                <li>
                  <strong className="text-foreground font-medium">TECHSHASTRA Brand Assets:</strong> The club name, logos, graphics, certificate templates, and UI designs are the intellectual property of TECHSHASTRA and UTU.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">04.</span> Certificates &amp; Verification System
              </h2>
              <p>
                TECHSHASTRA issues digital certificates of achievement, workshop participation, and club membership with verifiable cryptographic IDs:
              </p>
              <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
                <li>Any alteration, forgery, or tampering with a certificate invalidates the credential.</li>
                <li>Certificates can be publicly validated at <code className="text-primary font-mono text-xs">/verify/:certificateId</code>.</li>
                <li>TECHSHASTRA reserves the right to revoke any certificate issued under fraudulent grounds or disciplinary violations.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">05.</span> Disclaimers &amp; Limitation of Liability
              </h2>
              <p>
                The platform, student directory, code sandboxes, and learning resources are provided on an "as-is" and "as-available" basis without warranties of any kind. TECHSHASTRA is not liable for any direct, indirect, incidental, or consequential damages resulting from platform downtime, third-party GitHub API rate limits, or loss of project data.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">06.</span> Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in Dehradun, Uttarakhand, India.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-primary/20 bg-primary/[0.02]">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">07.</span> Contact &amp; Grievance Redressal
              </h2>
              <p>
                For questions regarding these Terms or to report a violation, please contact club leadership:
              </p>
              <div className="flex items-center gap-2 text-xs text-foreground/70">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <a href="mailto:vmsb.utu.ddn.2023@gmail.com" className="hover:text-primary transition-colors">
                  vmsb.utu.ddn.2023@gmail.com
                </a>
                <span>· Uttarakhand Technical University, Dehradun</span>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
