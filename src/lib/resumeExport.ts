/**
 * Resume export helpers — no external deps.
 *
 * 1. PDF  → window.print() after injecting a print-only stylesheet.
 * 2. LaTeX → generates a .tex string and triggers a file download.
 */

import type { StudentProfile } from "./studentStore";
import type { GHUser, GHRepo } from "./githubApi";
import { langPercents } from "./githubApi";

// ─── PDF via print ─────────────────────────────────────────────────────────────

const PRINT_STYLE_ID = "ts-resume-print-style";

export const printResume = () => {
  // Inject a stylesheet that hides everything except #resume-printable
  if (!document.getElementById(PRINT_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    style.textContent = `
      @media print {
        body > *:not(#resume-printable) { display: none !important; }
        #resume-printable { display: block !important; position: static !important; }
        @page { margin: 1.5cm; size: A4; }
      }
    `;
    document.head.appendChild(style);
  }
  window.print();
};

// ─── LaTeX generation ──────────────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/[&%$#_{}~^\\]/g, (c) => `\\${c}`);

const section = (title: string, body: string) =>
  `\\section{${esc(title)}}\n${body}\n`;

export const generateLatex = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[],
  langMap: Record<string, number>
): string => {
  const name = esc(ghUser?.name ?? student.name);
  const email = esc(student.email);
  const location = esc(ghUser?.location ?? "");
  const github = esc(`github.com/${student.githubUsername}`);
  const linkedin = student.linkedinUrl ? esc(student.linkedinUrl.replace(/^https?:\/\//, "")) : "";

  // Contact line
  const contactParts = [email, github, linkedin, location].filter(Boolean);
  const contactLine = contactParts.join(" \\textbar{} ");

  // Skills
  const skillsSection = student.skills.length
    ? section("Skills", `\\begin{itemize}[noitemsep,leftmargin=*]\n${student.skills.map((s) => `  \\item ${esc(s)}`).join("\n")}\n\\end{itemize}`)
    : "";

  // Languages from GitHub
  const langs = langPercents(langMap).slice(0, 10);
  const langsSection = langs.length
    ? section(
        "Programming Languages",
        `\\begin{itemize}[noitemsep,leftmargin=*]\n${langs
          .map((l) => `  \\item ${esc(l.lang)}: ${l.pct}\\%`)
          .join("\n")}\n\\end{itemize}`
      )
    : "";

  // Education
  const eduSection = student.education.length
    ? section(
        "Education",
        student.education
          .map(
            (e) =>
              `\\textbf{${esc(e.institution)}} \\hfill ${esc(e.startYear)}--${esc(e.endYear ?? "Present")}\\\\\n${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ""}${e.grade ? ` \\hfill GPA: ${esc(e.grade)}` : ""}`
          )
          .join("\n\n")
      )
    : "";

  // Experience
  const expSection = student.experience.length
    ? section(
        "Experience",
        student.experience
          .map(
            (x) =>
              `\\textbf{${esc(x.role)}} at \\textit{${esc(x.company)}} \\hfill ${esc(x.startDate)}--${esc(x.endDate ?? "Present")}\n${x.description ? `\\\\\n${esc(x.description)}` : ""}`
          )
          .join("\n\n")
      )
    : "";

  // Certifications
  const certSection = student.certifications.length
    ? section(
        "Certifications",
        `\\begin{itemize}[noitemsep,leftmargin=*]\n${student.certifications
          .map((c) => `  \\item ${esc(c.name)} — ${esc(c.issuer)}${c.date ? ` (${esc(c.date)})` : ""}`)
          .join("\n")}\n\\end{itemize}`
      )
    : "";

  // Top repos
  const topRepos = repos.filter((r) => !r.fork).slice(0, 6);
  const reposSection = topRepos.length
    ? section(
        "Projects (GitHub)",
        `\\begin{itemize}[noitemsep,leftmargin=*]\n${topRepos
          .map(
            (r) =>
              `  \\item \\textbf{${esc(r.name)}}${r.language ? ` (${esc(r.language)})` : ""} — ${esc(r.description ?? "")} \\hfill \\href{${esc(r.html_url)}}{link}`
          )
          .join("\n")}\n\\end{itemize}`
      )
    : "";

  // Interests
  const interestsSection = student.interests.length
    ? section(
        "Interests",
        student.interests.map((i) => esc(i)).join(", ")
      )
    : "";

  return `\\documentclass[10pt,a4paper]{article}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{parskip}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\hypersetup{colorlinks=true,urlcolor=blue,linkcolor=blue}

\\begin{document}

\\begin{center}
  {\\LARGE \\textbf{${name}}}\\\\[4pt]
  ${contactLine}
\\end{center}

${ghUser?.bio ? `\\textit{${esc(ghUser.bio)}}\n\n` : ""}
${eduSection}
${expSection}
${skillsSection}
${langsSection}
${reposSection}
${certSection}
${interestsSection}

\\end{document}
`;
};

export const downloadLatex = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[],
  langMap: Record<string, number>
) => {
  const tex = generateLatex(student, ghUser, repos, langMap);
  const blob = new Blob([tex], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${student.githubUsername}-resume.tex`;
  a.click();
  URL.revokeObjectURL(url);
};
