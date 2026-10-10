/**
 * ResumeDocument — printable A4 resume layout.
 *
 * Rendered as a React component so it gets full JSX composability,
 * then serialised to a self-contained HTML string and opened in a
 * new window for clean print / Save-as-PDF.
 *
 * Design: two-column layout (sidebar 30% | main 70%).
 * Accent colour: deep wine #2A0F14 (brand primary, print-safe).
 * All styles are inline so the document is self-contained.
 */

import type { StudentProfile } from "@/lib/studentStore";
import type { GHUser, GHRepo } from "@/lib/githubApi";
import { langPercents } from "@/lib/githubApi";

// ─── COLOUR TOKENS (print-safe, no CSS variables) ────────────────────────────

const C = {
  accent:    "#2A0F14",   // wine primary
  accentMid: "#5C2030",   // slightly lighter wine for sidebar bg
  accentBg:  "#F9F5F5",   // near-white with warm tint
  muted:     "#6B5B5D",   // muted text
  border:    "#D4C4C6",   // soft border
  white:     "#FFFFFF",
  text:      "#1A0B0D",   // near-black body text
  tag:       "#EDE0E2",   // pill background
};

const S = {
  // Layout
  page: `
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10px;
    color: ${C.text};
    background: ${C.white};
    margin: 0;
    padding: 0;
    line-height: 1.5;
  `,
  wrap: `
    display: flex;
    min-height: 297mm;
    width: 210mm;
    margin: 0 auto;
  `,
  // Sidebar
  sidebar: `
    width: 30%;
    background: ${C.accent};
    color: ${C.white};
    padding: 28px 20px;
    box-sizing: border-box;
    flex-shrink: 0;
  `,
  // Main content
  main: `
    flex: 1;
    padding: 28px 24px;
    box-sizing: border-box;
    background: ${C.white};
  `,
  // Name
  name: `
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.03em;
    line-height: 1.2;
    margin: 0 0 2px 0;
    color: ${C.accent};
  `,
  title: `
    font-size: 11px;
    color: ${C.muted};
    font-weight: 400;
    margin: 0 0 12px 0;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  `,
  // Section headers
  sectionHead: `
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${C.white};
    margin: 20px 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(255,255,255,0.25);
  `,
  mainSectionHead: `
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${C.accent};
    margin: 18px 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1.5px solid ${C.accent};
  `,
  // Contact rows in sidebar
  contactRow: `
    font-size: 9px;
    color: rgba(255,255,255,0.85);
    margin: 4px 0;
    word-break: break-all;
    display: flex;
    align-items: flex-start;
    gap: 5px;
    line-height: 1.4;
  `,
  // Skill / interest pill
  pill: `
    display: inline-block;
    background: rgba(255,255,255,0.15);
    color: ${C.white};
    font-size: 8.5px;
    padding: 2px 7px;
    border-radius: 20px;
    margin: 2px 2px 2px 0;
  `,
  // Entry block (edu, exp)
  entryTitle: `
    font-size: 10.5px;
    font-weight: 600;
    margin: 0 0 1px 0;
    color: ${C.text};
  `,
  entryMeta: `
    font-size: 9px;
    color: ${C.muted};
    margin: 0 0 3px 0;
  `,
  entryDesc: `
    font-size: 9px;
    color: #3D2529;
    margin: 3px 0 0 0;
    line-height: 1.5;
  `,
  // Language bar
  langRow: `
    margin-bottom: 5px;
  `,
  langLabel: `
    display: flex;
    justify-content: space-between;
    font-size: 8.5px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 2px;
  `,
  langBarBg: `
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    overflow: hidden;
  `,
  langBarFill: (pct: number) => `
    height: 100%;
    background: rgba(255,255,255,0.75);
    border-radius: 2px;
    width: ${pct}%;
  `,
  // Repo row
  repoRow: `
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 4px 0;
    padding: 5px 8px;
    background: ${C.tag};
    border-radius: 4px;
  `,
  repoName: `
    font-size: 9.5px;
    font-weight: 600;
    color: ${C.accent};
  `,
  repoMeta: `
    font-size: 8.5px;
    color: ${C.muted};
  `,
  // Cert row
  certRow: `
    margin: 4px 0;
    font-size: 9px;
  `,
  dot: `
    display: inline-block;
    width: 5px;
    height: 5px;
    background: ${C.accent};
    border-radius: 50%;
    margin-right: 6px;
    margin-bottom: 1px;
    vertical-align: middle;
  `,
  // Section divider in main (subtle)
  divider: `
    border: none;
    border-top: 1px solid ${C.border};
    margin: 14px 0;
  `,
};

// ─── HTML GENERATOR ───────────────────────────────────────────────────────────

const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const generateResumeHTML = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[],
  langMap: Record<string, number>
): string => {
  const name = ghUser?.name ?? student.name;
  const bio  = ghUser?.bio  ?? student.bio ?? "";
  const langs = langPercents(langMap).slice(0, 8);
  const topProjects = repos.filter(r => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count)
    .slice(0, 6);

  // ── SIDEBAR CONTENT ──────────────────────────────────────────────────────

  const contactHtml = [
    student.email      && `<div style="${S.contactRow}"><span>✉</span><span>${e(student.email)}</span></div>`,
    `<div style="${S.contactRow}"><span>⌥</span><span>github.com/${e(student.githubUsername)}</span></div>`,
    student.linkedinUrl  && `<div style="${S.contactRow}"><span>in</span><span>${e(student.linkedinUrl.replace(/^https?:\/\//, ""))}</span></div>`,
    student.portfolioUrl && `<div style="${S.contactRow}"><span>⊕</span><span>${e(student.portfolioUrl.replace(/^https?:\/\//, ""))}</span></div>`,
    ghUser?.location   && `<div style="${S.contactRow}"><span>⌖</span><span>${e(ghUser.location)}</span></div>`,
  ].filter(Boolean).join("\n");

  const skillsHtml = student.skills.length
    ? `<div style="${S.sectionHead}">Skills</div>
       <div>${student.skills.map(s => `<span style="${S.pill}">${e(s)}</span>`).join("")}</div>`
    : "";

  const interestsHtml = student.interests.length
    ? `<div style="${S.sectionHead}">Interests</div>
       <div>${student.interests.map(i => `<span style="${S.pill}">${e(i)}</span>`).join("")}</div>`
    : "";

  const langsHtml = langs.length
    ? `<div style="${S.sectionHead}">Languages</div>
       ${langs.map(l => `
         <div style="${S.langRow}">
           <div style="${S.langLabel}"><span>${e(l.lang)}</span><span>${l.pct}%</span></div>
           <div style="${S.langBarBg}"><div style="${S.langBarFill(Math.min(l.pct, 100))}"></div></div>
         </div>`).join("")}`
    : "";

  const certsHtml = student.certifications.length
    ? `<div style="${S.sectionHead}">Certifications</div>
       ${student.certifications.map(c => `
         <div style="${S.certRow}; color: rgba(255,255,255,0.85)">
           <strong>${e(c.name)}</strong><br>
           <span style="opacity:0.7">${e(c.issuer)}${c.date ? ` · ${e(c.date)}` : ""}</span>
         </div>`).join("")}`
    : "";

  const ghStatsHtml = `
    <div style="${S.sectionHead}">GitHub</div>
    <div style="font-size:8.5px; color:rgba(255,255,255,0.8); line-height:1.8">
      ${repos.filter(r => !r.fork).length} repositories<br>
      ${repos.reduce((s, r) => s + r.stargazers_count, 0)} total stars<br>
      ${ghUser?.followers ?? 0} followers
    </div>`;

  // ── MAIN CONTENT ─────────────────────────────────────────────────────────

  const summaryHtml = bio
    ? `<p style="font-size:9.5px; color:${C.muted}; font-style:italic; margin:0 0 4px 0; line-height:1.6">${e(bio)}</p>`
    : "";

  const educationHtml = student.education.length
    ? `<div style="${S.mainSectionHead}">Education</div>
       ${student.education.map(ed => `
         <div style="margin-bottom:10px">
           <div style="display:flex; justify-content:space-between; align-items:baseline">
             <span style="${S.entryTitle}">${e(ed.institution)}</span>
             <span style="${S.entryMeta}">${e(ed.startYear)} – ${e(ed.endYear ?? "Present")}</span>
           </div>
           <div style="${S.entryMeta}">${e(ed.degree)}${ed.field ? `, ${e(ed.field)}` : ""}${ed.grade ? ` · ${e(ed.grade)}` : ""}</div>
         </div>`).join("")}`
    : "";

  const experienceHtml = student.experience.length
    ? `<div style="${S.mainSectionHead}">Experience</div>
       ${student.experience.map(x => `
         <div style="margin-bottom:10px">
           <div style="display:flex; justify-content:space-between; align-items:baseline">
             <span style="${S.entryTitle}">${e(x.role)}</span>
             <span style="${S.entryMeta}">${e(x.startDate)} – ${e(x.endDate ?? "Present")}</span>
           </div>
           <div style="${S.entryMeta}">${e(x.company)}</div>
           ${x.description ? `<div style="${S.entryDesc}">${e(x.description)}</div>` : ""}
         </div>`).join("")}`
    : "";

  const projectsHtml = topProjects.length
    ? `<div style="${S.mainSectionHead}">Projects</div>
       ${topProjects.map(r => `
         <div style="${S.repoRow}">
           <div>
             <span style="${S.repoName}">${e(r.name)}</span>
             ${r.description ? `<div style="font-size:8.5px; color:${C.muted}; margin-top:1px">${e(r.description)}</div>` : ""}
           </div>
           <div style="text-align:right; flex-shrink:0; margin-left:8px">
             ${r.language ? `<div style="${S.repoMeta}">⬡ ${e(r.language)}</div>` : ""}
             ${r.stargazers_count ? `<div style="${S.repoMeta}">★ ${r.stargazers_count}</div>` : ""}
           </div>
         </div>`).join("")}`
    : "";

  const courseHtml = student.course
    ? `<span style="font-size:10px; color:${C.muted}; text-transform:uppercase; letter-spacing:0.08em">${e(student.course)}${student.year ? ` · ${e(student.year)}` : ""}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${e(name)} — Resume</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { ${S.page} }
  @page { size: A4; margin: 0; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  a { color: inherit; text-decoration: none; }
</style>
</head>
<body>
<div style="${S.wrap}">

  <!-- SIDEBAR -->
  <aside style="${S.sidebar}">
    <!-- Avatar initials -->
    <div style="width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.15);
         display:flex; align-items:center; justify-content:center; margin-bottom:16px;
         font-size:24px; font-weight:700; color:${C.white}">
      ${e(name.charAt(0).toUpperCase())}
    </div>

    <div style="${S.sectionHead}; margin-top:0; border:none; padding:0; font-size:8px">Contact</div>
    ${contactHtml}
    ${langsHtml}
    ${skillsHtml}
    ${interestsHtml}
    ${certsHtml}
    ${ghStatsHtml}
  </aside>

  <!-- MAIN -->
  <main style="${S.main}">

    <!-- Header -->
    <h1 style="${S.name}">${e(name)}</h1>
    ${courseHtml ? `<p style="${S.title}">${courseHtml}</p>` : ""}
    ${summaryHtml}

    <hr style="${S.divider}">

    ${educationHtml}
    ${experienceHtml}
    ${projectsHtml}

    ${!educationHtml && !experienceHtml && !projectsHtml ? `
      <div style="font-size:9px; color:${C.muted}; font-style:italic; margin-top:16px">
        Complete your profile to populate this resume with education, experience, and projects.
      </div>` : ""}
  </main>
</div>
</body>
</html>`;
};

// ─── OPEN HELPERS ────────────────────────────────────────────────────────────

const openWindow = (html: string): Window | null => {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Please allow popups to preview/print your resume."); return null; }
  win.document.write(html);
  win.document.close();
  return win;
};

/** Open resume in new window — no print dialog, student can review first */
export const previewResume = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[],
  langMap: Record<string, number>
) => {
  openWindow(generateResumeHTML(student, ghUser, repos, langMap));
};

/** Open resume in new window then immediately trigger print dialog */
export const openResumePrintWindow = (
  student: StudentProfile,
  ghUser: GHUser | null,
  repos: GHRepo[],
  langMap: Record<string, number>
) => {
  const win = openWindow(generateResumeHTML(student, ghUser, repos, langMap));
  if (win) setTimeout(() => win.print(), 600);
};
