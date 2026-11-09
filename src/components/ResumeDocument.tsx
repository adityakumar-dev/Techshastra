/**
 * ResumeDocument — Professional Executive Tech Resume Template (ATS-Compliant).
 *
 * Designed to meet international tech hiring standards (FAANG / Tech Startup standard).
 * High-contrast, clean typography, single-column flow with elegant dividers,
 * categorized technical skills, and structured impact-driven project bullets.
 */

import type { StudentProfile } from "@/lib/studentStore";
import type { GHUser, GHRepo } from "@/lib/githubApi";
import { langPercents } from "@/lib/githubApi";

export interface ResumeProjectItem {
  id: string;
  name: string;
  techStack: string;
  link?: string;
  github?: string;
  bullets: string[];
}

export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  skills: {
    languages: string;
    frameworks: string;
    developerTools: string;
    coreConcepts: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    grade?: string;
  }>;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  projects: ResumeProjectItem[];
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date?: string;
  }>;
}

const e = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Generates an intelligent, high-impact default ResumeData object pre-filled
 * with real student details and professional placeholder text where missing.
 */
export const getDefaultResumeData = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[] = [],
  langMap: Record<string, number> = {}
): ResumeData => {
  const name = student.name || ghUser?.name || "Student Developer";
  const course = student.course || "B.Tech in Computer Science & Engineering";
  const year = student.year ? `${student.year} Year` : "";

  // Compute top languages from GitHub + profile skills
  const topLangs = langPercents(langMap).slice(0, 6).map((l) => l.lang);
  const allLangs = Array.from(new Set([...topLangs, ...student.skills.filter(s => ["JavaScript", "TypeScript", "Python", "C++", "Java", "C", "Go", "Rust", "HTML/CSS", "SQL"].includes(s))]));
  const defaultLangs = allLangs.length > 0 ? allLangs.join(", ") : "JavaScript, TypeScript, Python, C++, SQL, HTML/CSS";

  // Pre-fill top projects from GitHub repos
  const topRepos = repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count)
    .slice(0, 3);

  const projects: ResumeProjectItem[] =
    topRepos.length > 0
      ? topRepos.map((r) => ({
          id: String(r.id),
          name: r.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          techStack: r.language ? `${r.language}, React, Git` : "React, TypeScript, Tailwind CSS",
          link: r.homepage || undefined,
          github: r.html_url,
          bullets: [
            r.description ||
              `Architected and built a responsive full-stack application featuring modular component design and optimized performance.`,
            `Engineered RESTful API integration, dynamic data persistence, and interactive user state management.`,
            `Maintained clean code standards, comprehensive documentation, and deployed production builds to cloud hosting.`,
          ],
        }))
      : [
          {
            id: "sample-proj-1",
            name: "TechShastra Campus Collaboration Hub",
            techStack: "React, TypeScript, Supabase, Tailwind CSS",
            link: "https://techshastra.vmsbutu.live",
            github: `https://github.com/${student.githubUsername || "techshastra"}`,
            bullets: [
              "Engineered an interactive student learning and project collaboration ecosystem for university engineering students.",
              "Implemented secure authentication, real-time leaderboards, and code sandbox execution pipelines.",
              "Designed responsive glassmorphism UI with Tailwind CSS and Framer Motion for high user engagement.",
            ],
          },
          {
            id: "sample-proj-2",
            name: "Algorithmic Problem Solving & Code Runner",
            techStack: "Python, JavaScript, Docker, REST API",
            bullets: [
              "Developed an automated code evaluation sandbox executing multi-language unit tests with sub-second feedback.",
              "Implemented dynamic test case evaluation, memory constraint profiling, and error boundary handling.",
            ],
          },
        ];

  // Education prefill
  const education =
    student.education && student.education.length > 0
      ? student.education.map((ed) => ({
          id: ed.id,
          institution: ed.institution || "Uttarakhand Technical University (VMSB UTU)",
          degree: ed.degree || course,
          field: ed.field || "Computer Science and Engineering",
          startYear: ed.startYear || "2023",
          endYear: ed.endYear || "2027",
          grade: ed.grade || "First Division",
        }))
      : [
          {
            id: "edu-default",
            institution: "Veer Madho Singh Bhandari Uttarakhand Technical University",
            degree: course,
            field: "Computer Science & Engineering",
            startYear: "2023",
            endYear: "2027",
            grade: "CGPA: 8.5 / 10",
          },
        ];

  // Experience prefill
  const experience =
    student.experience && student.experience.length > 0
      ? student.experience
      : [
          {
            id: "exp-default",
            role: "Technical Core Member & Contributor",
            company: "TechShastra Technical Club · UTU",
            startDate: "August 2023",
            endDate: "Present",
            description:
              "Collaborated with peer engineers to build university open-source projects, conducted hands-on coding bootcamps on React and Data Structures, and organized annual technical hackathons.",
          },
        ];

  return {
    fullName: name,
    headline: `${course}${year ? ` · ${year}` : ""} | Software Developer`,
    email: student.email || "developer@techshastra.edu",
    phone: student.rollNumber ? `Roll: ${student.rollNumber}` : "+91 ••••• •••••",
    location: ghUser?.location || "Dehradun, Uttarakhand, India",
    github: `github.com/${student.githubUsername || ""}`,
    linkedin: student.linkedinUrl ? student.linkedinUrl.replace(/^https?:\/\//, "") : "",
    portfolio: student.portfolioUrl ? student.portfolioUrl.replace(/^https?:\/\//, "") : "",
    summary:
      student.bio ||
      `Passionate Computer Science student and software engineer with solid foundations in data structures, algorithms, and full-stack development. Experienced in building responsive web applications with modern frameworks like React and TypeScript. Eager to solve real-world problems and deliver high-impact software solutions.`,
    skills: {
      languages: defaultLangs,
      frameworks: "React, Next.js, Node.js, Express.js, Tailwind CSS, Vite",
      developerTools: "Git, GitHub, VS Code, Postman, Supabase, Linux, Vercel, Docker",
      coreConcepts: "Data Structures & Algorithms, Object-Oriented Programming, RESTful APIs, Database Design, System Architecture",
    },
    education,
    experience,
    projects,
    certifications: student.certifications || [],
  };
};

/**
 * Generates clean, ATS-compliant, single-column HTML for printing and PDF export.
 */
export const generateProfessionalResumeHTML = (data: ResumeData): string => {
  const contactItems = [
    data.email && `<a href="mailto:${e(data.email)}">✉ ${e(data.email)}</a>`,
    data.phone && `<span>📞 ${e(data.phone)}</span>`,
    data.location && `<span>📍 ${e(data.location)}</span>`,
    data.linkedin && `<a href="https://${e(data.linkedin)}" target="_blank">in/${e(data.linkedin)}</a>`,
    data.github && `<a href="https://${e(data.github)}" target="_blank">⌥ ${e(data.github)}</a>`,
    data.portfolio && `<a href="https://${e(data.portfolio)}" target="_blank">🌐 ${e(data.portfolio)}</a>`,
  ].filter(Boolean);

  const educationHTML = data.education
    .map(
      (ed) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <strong class="entry-title">${e(ed.institution)}</strong>
            <span class="entry-subtitle">${e(ed.degree)}${ed.field ? ` in ${e(ed.field)}` : ""}${ed.grade ? ` · <span class="highlight">${e(ed.grade)}</span>` : ""}</span>
          </div>
          <span class="entry-date">${e(ed.startYear)} – ${e(ed.endYear || "Present")}</span>
        </div>
      </div>`
    )
    .join("");

  const experienceHTML = data.experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <strong class="entry-title">${e(exp.role)}</strong>
            <span class="entry-subtitle">@ ${e(exp.company)}</span>
          </div>
          <span class="entry-date">${e(exp.startDate)} – ${e(exp.endDate || "Present")}</span>
        </div>
        ${exp.description ? `<p class="entry-desc">${e(exp.description)}</p>` : ""}
      </div>`
    )
    .join("");

  const projectsHTML = data.projects
    .map((p) => {
      const bulletsHTML = (p.bullets || [])
        .filter((b) => b.trim().length > 0)
        .map((b) => `<li>${e(b)}</li>`)
        .join("");

      return `
      <div class="entry">
        <div class="entry-header">
          <div>
            <strong class="entry-title">${e(p.name)}</strong>
            ${p.techStack ? `<span class="tech-tag">${e(p.techStack)}</span>` : ""}
          </div>
          <div class="entry-links">
            ${p.link ? `<a href="${e(p.link)}" target="_blank" class="link-btn">Live ↗</a>` : ""}
            ${p.github ? `<a href="${e(p.github)}" target="_blank" class="link-btn">Code ↗</a>` : ""}
          </div>
        </div>
        ${bulletsHTML ? `<ul class="bullets">${bulletsHTML}</ul>` : ""}
      </div>`;
    })
    .join("");

  const certsHTML =
    data.certifications && data.certifications.length > 0
      ? data.certifications
          .map(
            (c) => `
        <div class="cert-item">
          <strong>${e(c.name)}</strong> — <span>${e(c.issuer)}</span>${c.date ? ` <span class="entry-date">(${e(c.date)})</span>` : ""}
        </div>`
          )
          .join("")
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(data.fullName)} — Professional Resume</title>
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 14mm 12mm 14mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    line-height: 1.45;
    font-size: 9.5pt;
    -webkit-font-smoothing: antialiased;
  }
  .resume-container {
    max-width: 210mm;
    margin: 0 auto;
    padding: 12px 16px;
    background: #ffffff;
  }

  /* ── HEADER ── */
  header {
    text-align: center;
    border-bottom: 2px solid #2a0f14;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  h1.name {
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #2a0f14;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .headline {
    font-size: 10pt;
    color: #4a4a4a;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .contact-bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    font-size: 8.5pt;
    color: #555555;
  }
  .contact-bar a {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s;
  }
  .contact-bar a:hover {
    color: #2a0f14;
    text-decoration: underline;
  }

  /* ── SECTIONS ── */
  section {
    margin-bottom: 11px;
  }
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #2a0f14;
    border-bottom: 1px solid #dcdcdc;
    padding-bottom: 2px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e5e5;
  }

  /* ── SUMMARY ── */
  .summary-text {
    font-size: 9pt;
    color: #333333;
    line-height: 1.45;
    text-align: justify;
  }

  /* ── ENTRIES ── */
  .entry {
    margin-bottom: 7px;
    page-break-inside: avoid;
  }
  .entry:last-child {
    margin-bottom: 0;
  }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 2px;
  }
  .entry-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #111111;
  }
  .entry-subtitle {
    font-size: 9pt;
    color: #444444;
    margin-left: 4px;
    font-weight: 400;
  }
  .entry-date {
    font-size: 8.5pt;
    color: #666666;
    font-style: italic;
    white-space: nowrap;
  }
  .entry-desc {
    font-size: 8.8pt;
    color: #333333;
    line-height: 1.4;
    margin-top: 2px;
  }
  .entry-links {
    display: flex;
    gap: 6px;
    font-size: 8pt;
  }
  .link-btn {
    color: #2a0f14;
    text-decoration: none;
    font-weight: 600;
    background: #f4eff1;
    padding: 1px 6px;
    border-radius: 4px;
  }
  .link-btn:hover {
    background: #2a0f14;
    color: #ffffff;
  }
  .tech-tag {
    font-size: 8pt;
    font-weight: 500;
    color: #555555;
    background: #f0f0f0;
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: 6px;
    display: inline-block;
  }
  .highlight {
    font-weight: 600;
    color: #2a0f14;
  }

  /* ── BULLETS ── */
  ul.bullets {
    margin: 3px 0 3px 18px;
    padding: 0;
  }
  ul.bullets li {
    font-size: 8.8pt;
    color: #333333;
    line-height: 1.4;
    margin-bottom: 2px;
  }

  /* ── SKILLS ── */
  .skills-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.8pt;
  }
  .skills-table td {
    padding: 2px 0;
    vertical-align: top;
  }
  .skill-category {
    font-weight: 700;
    color: #2a0f14;
    width: 155px;
    padding-right: 8px;
  }
  .skill-list {
    color: #333333;
  }

  /* ── CERTS ── */
  .cert-item {
    font-size: 8.8pt;
    color: #333333;
    margin-bottom: 3px;
  }

  /* ── PRINT RULES ── */
  @media print {
    body {
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .resume-container {
      padding: 0 !important;
      max-width: 100% !important;
    }
    .link-btn {
      background: none !important;
      padding: 0 !important;
      text-decoration: underline !important;
    }
  }
</style>
</head>
<body>
<div class="resume-container">

  <!-- ── HEADER ── -->
  <header>
    <h1 class="name">${e(data.fullName)}</h1>
    ${data.headline ? `<div class="headline">${e(data.headline)}</div>` : ""}
    <div class="contact-bar">
      ${contactItems.join(" • ")}
    </div>
  </header>

  <!-- ── PROFESSIONAL SUMMARY ── -->
  ${
    data.summary
      ? `
  <section>
    <h2 class="section-title">Professional Summary</h2>
    <p class="summary-text">${e(data.summary)}</p>
  </section>`
      : ""
  }

  <!-- ── TECHNICAL SKILLS ── -->
  <section>
    <h2 class="section-title">Technical Skills</h2>
    <table class="skills-table">
      ${data.skills.languages ? `<tr><td class="skill-category">Languages:</td><td class="skill-list">${e(data.skills.languages)}</td></tr>` : ""}
      ${data.skills.frameworks ? `<tr><td class="skill-category">Frameworks & Libraries:</td><td class="skill-list">${e(data.skills.frameworks)}</td></tr>` : ""}
      ${data.skills.developerTools ? `<tr><td class="skill-category">Developer Tools & Cloud:</td><td class="skill-list">${e(data.skills.developerTools)}</td></tr>` : ""}
      ${data.skills.coreConcepts ? `<tr><td class="skill-category">Core Concepts:</td><td class="skill-list">${e(data.skills.coreConcepts)}</td></tr>` : ""}
    </table>
  </section>

  <!-- ── KEY PROJECTS ── -->
  ${
    data.projects && data.projects.length > 0
      ? `
  <section>
    <h2 class="section-title">Featured Projects</h2>
    ${projectsHTML}
  </section>`
      : ""
  }

  <!-- ── EXPERIENCE & LEADERSHIP ── -->
  ${
    data.experience && data.experience.length > 0
      ? `
  <section>
    <h2 class="section-title">Experience & Leadership</h2>
    ${experienceHTML}
  </section>`
      : ""
  }

  <!-- ── EDUCATION ── -->
  <section>
    <h2 class="section-title">Education</h2>
    ${educationHTML}
  </section>

  <!-- ── CERTIFICATIONS ── -->
  ${
    certsHTML
      ? `
  <section>
    <h2 class="section-title">Certifications & Achievements</h2>
    ${certsHTML}
  </section>`
      : ""
  }

</div>
</body>
</html>`;
};

// ─── WINDOW HELPERS ──────────────────────────────────────────────────────────

const openWindow = (html: string): Window | null => {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=920,height=800");
  if (!win) {
    alert("Please allow popups in your browser to preview or print your resume.");
    URL.revokeObjectURL(url);
    return null;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return win;
};

/** Open resume in new tab for preview */
export const previewResume = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[] = [],
  langMap: Record<string, number> = {}
) => {
  const data = getDefaultResumeData(student, ghUser, repos, langMap);
  openWindow(generateProfessionalResumeHTML(data));
};

/** Open resume in print window then trigger browser print dialog */
export const openResumePrintWindow = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[] = [],
  langMap: Record<string, number> = {}
) => {
  const data = getDefaultResumeData(student, ghUser, repos, langMap);
  printResumeData(data);
};

/** Print custom edited resume data */
export const printResumeData = (data: ResumeData) => {
  const win = openWindow(generateProfessionalResumeHTML(data));
  if (win) {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 600);
  }
};
