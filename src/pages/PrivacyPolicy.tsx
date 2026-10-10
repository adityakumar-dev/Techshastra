import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText, CheckCircle2, AlertCircle, Mail, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const lastUpdated = "October 10, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" /> Legal & Compliance
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-light tracking-tight">
              Privacy <span className="text-primary italic">Policy</span>
            </h1>
            <p className="text-foreground/50 text-sm max-w-xl mx-auto font-light">
              Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act, India) and international data protection standards.
            </p>
            <p className="text-xs text-foreground/40 font-mono">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Quick Summary Card */}
          <Card className="glass border-primary/20 rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3 text-primary font-medium text-base">
                <Lock className="w-5 h-5 flex-shrink-0" />
                <span>Our Privacy Commitment in Brief</span>
              </div>
              <p className="text-sm text-foreground/70 font-light leading-relaxed">
                TECHSHASTRA (Technical &amp; Entrepreneurship Club of Uttarakhand Technical University, Dehradun) is committed to protecting your personal data. We collect only what is strictly necessary to power student directories, verified certificates, event registrations, and technical collaboration. We never sell or monetize your personal information.
              </p>
            </CardContent>
          </Card>

          {/* Policy Sections */}
          <div className="space-y-10 text-sm font-light leading-relaxed text-foreground/80">
            {/* Section 1 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">01.</span> Information We Collect
              </h2>
              <p>
                When you create an account, register for events, or interact with the TECHSHASTRA platform, we collect the following categories of data:
              </p>
              <ul className="space-y-2.5 pl-4 border-l-2 border-primary/20">
                <li>
                  <strong className="text-foreground font-medium">Personal Identity Data:</strong> Full name, university email address, contact phone number, and Uttarakhand Technical University (UTU) student roll number.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Academic &amp; Professional Profile:</strong> Degree course, branch, semester, graduation year, technical skills, biography, and work experience provided by you.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Social &amp; Developer Profiles:</strong> Public GitHub username (used to display your repository statistics and contribution graph with your consent) and LinkedIn profile URL.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Event &amp; Inquiry Data:</strong> Workshop registrations, team project submissions, and contact messages sent to club leadership.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Technical Log Data:</strong> Device browser, approximate IP location, and session cookies required for authentication and security rate-limiting.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">02.</span> Purpose and Legal Basis for Processing
              </h2>
              <p>
                Under Section 4 and Section 6 of the DPDP Act 2023, we process your personal data under the lawful basis of your explicit consent and legitimate institutional purposes:
              </p>
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-foreground/5 space-y-1.5">
                  <h3 className="font-medium text-foreground text-xs uppercase tracking-wider">Member Roster</h3>
                  <p className="text-xs text-foreground/60">Displaying student portfolio cards and technical projects in the community directory.</p>
                </div>
                <div className="p-4 rounded-2xl bg-foreground/5 space-y-1.5">
                  <h3 className="font-medium text-foreground text-xs uppercase tracking-wider">Verifiable Credentials</h3>
                  <p className="text-xs text-foreground/60">Issuing cryptographically verifiable event and achievement certificates via unique serial IDs.</p>
                </div>
                <div className="p-4 rounded-2xl bg-foreground/5 space-y-1.5">
                  <h3 className="font-medium text-foreground text-xs uppercase tracking-wider">Event Coordination</h3>
                  <p className="text-xs text-foreground/60">Managing attendee allocations, hackathon team compositions, and workshop notices.</p>
                </div>
                <div className="p-4 rounded-2xl bg-foreground/5 space-y-1.5">
                  <h3 className="font-medium text-foreground text-xs uppercase tracking-wider">Security &amp; Fraud Prevention</h3>
                  <p className="text-xs text-foreground/60">Protecting the community against brute-force attacks, spam bots, and unauthorized admin access.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">03.</span> Data Security, Storage &amp; Encryption
              </h2>
              <p>
                We adhere to strict organizational and technical data protection standards:
              </p>
              <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
                <li>
                  <strong className="text-foreground font-medium">Server Infrastructure:</strong> All persistent database records are hosted on Supabase (PostgreSQL) with enterprise-grade AES-256 data-at-rest encryption and TLS 1.3 in transit.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Row-Level Security (RLS):</strong> Granular PostgreSQL security policies restrict access so members can only edit their own individual profiles.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Password Protection:</strong> Account passwords are never stored in plaintext. They are cryptographically hashed using industry-standard hashing algorithms (Bcrypt/Argon2).
                </li>
                <li>
                  <strong className="text-foreground font-medium">No Data Selling:</strong> We do not sell, rent, or trade your data with any commercial third-party advertisers or data brokers.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">04.</span> Your Rights (DPDP Act &amp; GDPR)
              </h2>
              <p>
                As a registered student or user, you have complete control over your personal data:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground font-medium">Right to Access &amp; Summary:</strong> You may view all data linked to your account at any time through your profile.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground font-medium">Right to Rectification:</strong> You can edit and update your skills, bio, academic year, and links directly on the profile editor.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground font-medium">Right to Erasure ("Right to Be Forgotten"):</strong> You may request the permanent deletion of your profile and records by contacting our Grievance Officer.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground font-medium">Right to Grievance Redressal:</strong> You have the right to lodge a complaint regarding any data privacy concern directly with our institutional grievance authority.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-foreground/5">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">05.</span> Cookies &amp; Session Storage
              </h2>
              <p>
                We use strictly necessary cookies to maintain authenticated login states:
              </p>
              <ul className="space-y-1.5 pl-4 border-l-2 border-primary/20">
                <li><code className="text-primary font-mono text-xs">ts_student_session</code>: Manages authenticated student sessions with a 7-day expiration and <code className="text-xs">SameSite=Lax</code> security.</li>
                <li><code className="text-primary font-mono text-xs">supabase-auth-token</code>: Secure OAuth token maintaining cryptographic backend session validity.</li>
              </ul>
              <p className="text-xs text-foreground/50">
                We do not deploy third-party advertising tracking cookies or cross-site tracking pixels.
              </p>
            </section>

            {/* Section 6 - Grievance Officer */}
            <section className="space-y-4 glass p-8 rounded-3xl border border-primary/20 bg-primary/[0.02]">
              <h2 className="text-xl font-heading text-foreground font-normal flex items-center gap-2">
                <span className="text-primary font-mono text-base">06.</span> Designated Grievance Officer
              </h2>
              <p>
                In compliance with the Digital Personal Data Protection Act, 2023, the designated Grievance Officer for TECHSHASTRA is:
              </p>
              <div className="p-5 rounded-2xl glass border border-foreground/10 space-y-2 text-xs">
                <p className="text-foreground font-medium text-sm">Grievance &amp; Data Protection Officer</p>
                <div className="flex items-center gap-2 text-foreground/70">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>Technical &amp; Entrepreneurship Club, Uttarakhand Technical University</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/70">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <a href="mailto:vmsb.utu.ddn.2023@gmail.com" className="hover:text-primary transition-colors">
                    vmsb.utu.ddn.2023@gmail.com
                  </a>
                </div>
                <p className="text-foreground/50 pt-1">
                  Campus Address: UTU Dehradun, Chandanwadi, Prem Nagar, Dehradun, Uttarakhand 248007, India.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
