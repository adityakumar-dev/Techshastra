/**
 * autoProfile.ts
 *
 * Derives as much profile data as possible from GitHub data alone.
 * Called once on first own-profile load when the profile looks empty.
 *
 * Sources used:
 *   GHUser  → bio, location, company, blog (→ portfolioUrl)
 *   GHRepo[] → repo topics (→ skills), repo descriptions (→ project hints)
 *   langMap  → top languages (→ skills)
 *
 * LinkedIn: no public API — link is stored as-is, no auto-fill possible.
 * ponytail: pure derivation, no AI, no network calls beyond what's already fetched.
 */

import type { StudentProfile, ExperienceEntry } from "./studentStore";
import type { GHUser, GHRepo, GHLanguageMap } from "./githubApi";
import { langPercents } from "./githubApi";

// ─── TOPIC → SKILL normalisation map ─────────────────────────────────────────
// Maps common GitHub topic slugs to a human-readable skill label.
// Any topic not listed here is title-cased and used as-is.

const TOPIC_MAP: Record<string, string> = {
  // Web
  react: "React", nextjs: "Next.js", "next-js": "Next.js",
  vue: "Vue.js", vuejs: "Vue.js", angular: "Angular",
  svelte: "Svelte", astro: "Astro", remix: "Remix",
  tailwindcss: "Tailwind CSS", bootstrap: "Bootstrap",
  html: "HTML", css: "CSS", sass: "Sass", scss: "SCSS",
  javascript: "JavaScript", typescript: "TypeScript",
  nodejs: "Node.js", "node-js": "Node.js", express: "Express.js",
  fastapi: "FastAPI", flask: "Flask", django: "Django",
  // Mobile
  "react-native": "React Native", flutter: "Flutter", kotlin: "Kotlin", swift: "Swift",
  // AI / ML
  "machine-learning": "Machine Learning", "deep-learning": "Deep Learning",
  tensorflow: "TensorFlow", pytorch: "PyTorch", keras: "Keras",
  "computer-vision": "Computer Vision", nlp: "NLP",
  "natural-language-processing": "NLP", "data-science": "Data Science",
  pandas: "Pandas", numpy: "NumPy", sklearn: "scikit-learn",
  "scikit-learn": "scikit-learn", openai: "OpenAI API",
  // Backend / DB
  mongodb: "MongoDB", postgresql: "PostgreSQL", mysql: "MySQL",
  redis: "Redis", graphql: "GraphQL", restapi: "REST API",
  "rest-api": "REST API", supabase: "Supabase", firebase: "Firebase",
  prisma: "Prisma", sqlalchemy: "SQLAlchemy",
  // DevOps / Infra
  docker: "Docker", kubernetes: "Kubernetes", "ci-cd": "CI/CD",
  "github-actions": "GitHub Actions", aws: "AWS", gcp: "GCP",
  azure: "Azure", linux: "Linux", bash: "Bash", terraform: "Terraform",
  // Security
  cybersecurity: "Cybersecurity", ctf: "CTF", cryptography: "Cryptography",
  // IoT / Hardware
  iot: "IoT", "raspberry-pi": "Raspberry Pi", arduino: "Arduino",
  embedded: "Embedded Systems",
  // Other
  blockchain: "Blockchain", solidity: "Solidity", web3: "Web3",
  "game-development": "Game Development", unity: "Unity",
  "augmented-reality": "AR/VR", "virtual-reality": "AR/VR",
  opengl: "OpenGL", cpp: "C++",
};

const normaliseTopic = (t: string): string =>
  TOPIC_MAP[t.toLowerCase()] ?? t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

export interface AutoProfileResult {
  /** Fields to merge into the StudentProfile */
  updates: Partial<StudentProfile>;
  /** Human-readable summary of what was filled */
  summary: string[];
}

export const buildAutoProfile = (
  student: StudentProfile,
  ghUser: GHUser,
  repos: GHRepo[],
  langMap: GHLanguageMap
): AutoProfileResult => {
  const updates: Partial<StudentProfile> = {};
  const summary: string[] = [];

  // ── Bio ───────────────────────────────────────────────────────────────────
  if (!student.bio && ghUser.bio) {
    updates.bio = ghUser.bio;
    summary.push("Bio filled from GitHub");
  }

  // ── Portfolio URL ─────────────────────────────────────────────────────────
  if (!student.portfolioUrl && ghUser.blog) {
    const blog = ghUser.blog.startsWith("http") ? ghUser.blog : `https://${ghUser.blog}`;
    updates.portfolioUrl = blog;
    summary.push("Portfolio URL filled from GitHub blog field");
  }

  // ── Skills from languages ─────────────────────────────────────────────────
  const langSkills = langPercents(langMap)
    .slice(0, 8)
    .map((l) => l.lang)
    .filter((l) => !["Other", "Makefile", "Dockerfile", "YAML"].includes(l));

  // ── Skills from repo topics ───────────────────────────────────────────────
  const topicSkills = Array.from(
    new Set(
      repos
        .filter((r) => !r.fork)
        .flatMap((r) => r.topics)
        .map(normaliseTopic)
    )
  );

  const existingSkillsLower = new Set(student.skills.map((s) => s.toLowerCase()));
  const newSkills = [...langSkills, ...topicSkills].filter(
    (s) => !existingSkillsLower.has(s.toLowerCase())
  );

  // Merge — existing skills first, then new ones
  const mergedSkills = [
    ...student.skills,
    ...newSkills.filter(
      (s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i
    ),
  ];

  if (newSkills.length > 0) {
    updates.skills = mergedSkills;
    summary.push(`${newSkills.length} skills added from GitHub languages & repo topics`);
  }

  // ── Experience: company from GH profile ──────────────────────────────────
  if (ghUser.company && student.experience.length === 0) {
    const companyName = ghUser.company.replace(/^@/, ""); // GH sometimes prefixes with @
    const entry: ExperienceEntry = {
      id: crypto.randomUUID(),
      role: "Developer",
      company: companyName,
      startDate: new Date(ghUser.created_at).getFullYear().toString(),
      description: `Works at ${companyName} (from GitHub profile)`,
    };
    updates.experience = [entry];
    summary.push(`Experience entry added for "${companyName}" from GitHub`);
  }

  // ── Education: infer from bio / company text for UTU students ────────────
  // Only auto-add if bio or company mentions university keywords and edu is empty
  if (student.education.length === 0) {
    const haystack = [ghUser.bio ?? "", ghUser.company ?? "", student.course ?? ""]
      .join(" ")
      .toLowerCase();

    const utuKeywords = ["utu", "uttarakhand technical", "vmsb", "coer", "graphic era", "doon", "kumaon"];
    const matchedUni = utuKeywords.find((k) => haystack.includes(k));

    if (matchedUni || student.course) {
      const institution =
        matchedUni === "utu" || matchedUni === "uttarakhand technical" || matchedUni === "vmsb"
          ? "Uttarakhand Technical University"
          : matchedUni === "coer"
            ? "College of Engineering Roorkee"
            : matchedUni === "graphic era"
              ? "Graphic Era University"
              : "University (from profile)";

      const entry = {
        id: crypto.randomUUID(),
        institution,
        degree: student.course?.includes("B.Tech") || student.course?.includes("BTech")
          ? "B.Tech"
          : student.course?.includes("M.Tech")
            ? "M.Tech"
            : student.course
              ? student.course
              : "Bachelor's",
        field: student.course?.replace(/^B\.Tech\s*/i, "").replace(/^M\.Tech\s*/i, "") || "Engineering",
        startYear: (new Date().getFullYear() - (parseInt(student.year ?? "1") || 1) + 1).toString(),
        endYear: "",
        grade: "",
      };
      updates.education = [entry];
      summary.push(`Education entry inferred from profile data`);
    }
  }

  return { updates, summary };
};

/**
 * Returns true if the profile looks "empty enough" to warrant auto-filling.
 * We only auto-fill once — if skills are already populated, skip.
 */
export const profileNeedsAutoFill = (student: StudentProfile): boolean =>
  student.skills.length === 0 && student.education.length === 0;
