import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Printer,
  Download,
  Save,
  Plus,
  Trash2,
  FileText,
  Eye,
  Check,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { StudentProfile } from "@/lib/studentStore";
import type { GHUser, GHRepo } from "@/lib/githubApi";
import {
  type ResumeData,
  type ResumeProjectItem,
  getDefaultResumeData,
  generateProfessionalResumeHTML,
  printResumeData,
} from "@/components/ResumeDocument";
import { downloadLatex } from "@/lib/resumeExport";

interface ResumeBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentProfile;
  ghUser: GHUser | null;
  repos: GHRepo[];
  langMap: Record<string, number>;
  onSaveToProfile?: (updated: Partial<StudentProfile>) => void;
}

export default function ResumeBuilderModal({
  open,
  onOpenChange,
  student,
  ghUser,
  repos,
  langMap,
  onSaveToProfile,
}: ResumeBuilderModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [data, setData] = useState<ResumeData>(() =>
    getDefaultResumeData(student, ghUser, repos, langMap)
  );
  const [isSaved, setIsSaved] = useState(false);

  // Re-sync default data when opened or student changes
  useEffect(() => {
    if (open) {
      // Check if student has saved custom resume in localStorage
      const storageKey = `ts_resume_data_${student.id}`;
      const savedCustom = localStorage.getItem(storageKey);
      if (savedCustom) {
        try {
          setData(JSON.parse(savedCustom));
          return;
        } catch (_e) {}
      }
      setData(getDefaultResumeData(student, ghUser, repos, langMap));
    }
  }, [open, student, ghUser, repos, langMap]);

  // Handle field change helper
  const updateField = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  const updateSkills = (key: keyof ResumeData["skills"], val: string) => {
    setData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [key]: val },
    }));
  };

  // Add/remove project
  const addProject = () => {
    const newProj: ResumeProjectItem = {
      id: crypto.randomUUID(),
      name: "New Software Project",
      techStack: "React, TypeScript, Node.js",
      bullets: [
        "Architected scalable web application utilizing modern component architecture.",
        "Integrated dynamic REST APIs and optimized database retrieval performance.",
      ],
    };
    setData((prev) => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const updateProject = (idx: number, patch: Partial<ResumeProjectItem>) => {
    setData((prev) => {
      const next = [...prev.projects];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, projects: next };
    });
  };

  const removeProject = (idx: number) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  // Save changes locally and to profile
  const handleSave = () => {
    localStorage.setItem(`ts_resume_data_${student.id}`, JSON.stringify(data));
    if (onSaveToProfile) {
      onSaveToProfile({
        bio: data.summary,
        education: data.education,
        experience: data.experience,
      });
    }
    setIsSaved(true);
    toast({
      title: "Resume Data Saved ✓",
      description: "Your custom edits and entries have been preserved.",
    });
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePrint = () => {
    printResumeData(data);
  };

  const previewHtml = generateProfessionalResumeHTML(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[850px] flex flex-col p-0 overflow-hidden glass border-foreground/10 rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b border-foreground/10 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-heading font-light tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Professional Resume Builder
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/50 font-light mt-0.5">
                ATS-Optimized Executive Tech Template. Edit placeholders, preview, and print instantly.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                className="rounded-full text-xs font-light gap-1.5 h-8 px-3.5"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Save className="w-3.5 h-3.5" />}
                {isSaved ? "Saved" : "Save Draft"}
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="rounded-full text-xs font-medium gap-1.5 h-8 px-4 bg-primary text-primary-foreground shadow-md shadow-primary/20"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tab switch bar */}
        <div className="px-6 pt-3 shrink-0 flex items-center justify-between border-b border-foreground/5 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wider transition-all ${
                activeTab === "edit"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-foreground/5 text-foreground/60"
              }`}
            >
              Edit Content
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-foreground/5 text-foreground/60"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>

          <span className="text-[10px] uppercase tracking-widest text-foreground/40 hidden sm:inline font-mono">
            A4 Standard • 1-Page Layout
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card/20">
          {activeTab === "edit" ? (
            <div className="space-y-6 max-w-3xl mx-auto pb-8">
              {/* Personal Info Section */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-heading uppercase tracking-widest text-primary font-medium">
                  Header & Contact Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Full Name
                    </label>
                    <Input
                      value={data.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="Your Full Name"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Professional Headline
                    </label>
                    <Input
                      value={data.headline}
                      onChange={(e) => updateField("headline", e.target.value)}
                      placeholder="e.g. B.Tech CSE · Software Developer"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Email Address
                    </label>
                    <Input
                      value={data.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="email@example.com"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Phone Number / ID
                    </label>
                    <Input
                      value={data.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+91 ••••• •••••"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Location
                    </label>
                    <Input
                      value={data.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      placeholder="Dehradun, Uttarakhand, India"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      GitHub Profile
                    </label>
                    <Input
                      value={data.github}
                      onChange={(e) => updateField("github", e.target.value)}
                      placeholder="github.com/username"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      LinkedIn URL
                    </label>
                    <Input
                      value={data.linkedin}
                      onChange={(e) => updateField("linkedin", e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Portfolio / Website
                    </label>
                    <Input
                      value={data.portfolio}
                      onChange={(e) => updateField("portfolio", e.target.value)}
                      placeholder="yourportfolio.live"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="glass p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-heading uppercase tracking-widest text-primary font-medium">
                    Professional Summary
                  </h3>
                  <span className="text-[10px] text-foreground/40">2-3 impactful sentences</span>
                </div>
                <Textarea
                  value={data.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  rows={3}
                  className="glass text-xs rounded-xl border-foreground/10 resize-none leading-relaxed"
                  placeholder="Summarize your engineering background, top skills, and impact..."
                />
              </div>

              {/* Technical Skills Section */}
              <div className="glass p-5 rounded-2xl space-y-3.5">
                <h3 className="text-xs font-heading uppercase tracking-widest text-primary font-medium">
                  Technical Skills (Categorized)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Programming Languages
                    </label>
                    <Input
                      value={data.skills.languages}
                      onChange={(e) => updateSkills("languages", e.target.value)}
                      placeholder="JavaScript, TypeScript, Python, C++, Java, SQL"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Frameworks & Libraries
                    </label>
                    <Input
                      value={data.skills.frameworks}
                      onChange={(e) => updateSkills("frameworks", e.target.value)}
                      placeholder="React, Next.js, Node.js, Express, Tailwind CSS"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Developer Tools & Cloud
                    </label>
                    <Input
                      value={data.skills.developerTools}
                      onChange={(e) => updateSkills("developerTools", e.target.value)}
                      placeholder="Git, GitHub, Docker, Supabase, Linux, Postman, Vercel"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                      Core Concepts & Architecture
                    </label>
                    <Input
                      value={data.skills.coreConcepts}
                      onChange={(e) => updateSkills("coreConcepts", e.target.value)}
                      placeholder="Data Structures & Algorithms, RESTful APIs, System Design, OOP"
                      className="glass text-xs h-9 rounded-xl border-foreground/10"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Projects Section */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-heading uppercase tracking-widest text-primary font-medium">
                    Featured Software Projects
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addProject}
                    className="rounded-full text-xs h-7 gap-1 px-2.5 font-light"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </Button>
                </div>

                <div className="space-y-4">
                  {data.projects.map((proj, pIdx) => (
                    <div
                      key={proj.id || pIdx}
                      className="p-4 rounded-xl bg-background/50 border border-foreground/10 space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => removeProject(pIdx)}
                        className="absolute top-3 right-3 text-destructive/60 hover:text-destructive transition-colors text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid sm:grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                            Project Title
                          </label>
                          <Input
                            value={proj.name}
                            onChange={(e) => updateProject(pIdx, { name: e.target.value })}
                            placeholder="e.g. TechShastra Hub"
                            className="glass text-xs h-8 rounded-lg border-foreground/10"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                            Tech Stack
                          </label>
                          <Input
                            value={proj.techStack}
                            onChange={(e) => updateProject(pIdx, { techStack: e.target.value })}
                            placeholder="React, TypeScript, Tailwind"
                            className="glass text-xs h-8 rounded-lg border-foreground/10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-foreground/50 block">
                          Bullet Points (One per line)
                        </label>
                        <Textarea
                          value={proj.bullets.join("\n")}
                          onChange={(e) =>
                            updateProject(pIdx, {
                              bullets: e.target.value.split("\n"),
                            })
                          }
                          rows={2}
                          className="glass text-xs rounded-lg border-foreground/10 resize-none font-sans leading-relaxed"
                          placeholder="Key feature, architecture decision, or performance impact..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Section */}
              <div className="glass p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-heading uppercase tracking-widest text-primary font-medium">
                  Education
                </h3>
                {data.education.map((ed, edIdx) => (
                  <div key={ed.id || edIdx} className="grid sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                        Institution
                      </label>
                      <Input
                        value={ed.institution}
                        onChange={(e) => {
                          const next = [...data.education];
                          next[edIdx].institution = e.target.value;
                          setData((prev) => ({ ...prev, education: next }));
                        }}
                        className="glass text-xs h-8 rounded-lg border-foreground/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-foreground/50 block mb-1">
                        Years
                      </label>
                      <Input
                        value={`${ed.startYear} – ${ed.endYear}`}
                        onChange={(e) => {
                          const [s, end] = e.target.value.split("–").map((p) => p.trim());
                          const next = [...data.education];
                          next[edIdx].startYear = s || "";
                          next[edIdx].endYear = end || "";
                          setData((prev) => ({ ...prev, education: next }));
                        }}
                        className="glass text-xs h-8 rounded-lg border-foreground/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Live Preview Tab */
            <div className="w-full flex justify-center py-2 pb-6">
              <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-2xl overflow-hidden border border-border">
                <iframe
                  title="Resume Live Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[700px] border-none bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

