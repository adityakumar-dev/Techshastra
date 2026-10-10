/**
 * Student store — persistent student profiles + cookie-based auth session.
 *
 * ponytail: all data in localStorage, session token in a cookie (7-day expiry).
 * Ceiling: single-browser, no server sync. Upgrade: add a backend + JWT.
 */

import { createLocalStore } from "./localStore";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  created_at: string;
  updated_at?: string;

  // Core identity
  name: string;
  email: string;
  /** hashed with a simple deterministic hash — not crypto-grade, but stops plain-text storage */
  passwordHash: string;
  rollNumber?: string;
  course?: string;
  year?: string;
  bio?: string;
  avatar?: string; // URL or data-URL

  // Social links (LinkedIn is just stored/displayed — no API scraping possible)
  githubUsername: string; // bare username, e.g. "octocat"
  linkedinUrl?: string;   // full URL
  portfolioUrl?: string;

  // Manually filled profile sections (LinkedIn-equivalent data)
  skills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];

  // Interests collected on signup (reuse Join page interests list)
  interests: string[];

  is_active: boolean;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startYear: string;
  endYear?: string; // blank = present
  grade?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

// ─── COOKIE HELPERS ───────────────────────────────────────────────────────────

const COOKIE_KEY = "ts_student_session";
const COOKIE_DAYS = 7;

const setCookie = (value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
};

const getCookie = (): string | null => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const deleteCookie = () => {
  document.cookie = `${COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

// ─── PASSWORD HASHING ─────────────────────────────────────────────────────────

/**
 * Deterministic hash for password storage.
 * ponytail: djb2 — fast, no dep, not crypto-safe. Ceiling: brute-forceable offline.
 * Upgrade: use SubtleCrypto PBKDF2 when a backend exists.
 */
export const hashPassword = (password: string): string => {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) ^ password.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(16);
};

// ─── STORE ────────────────────────────────────────────────────────────────────

const store = createLocalStore<StudentProfile>("ts_students");

export const getAllStudents = store.getAll;
export const getStudentById = store.getById;

export const getStudentByEmail = (email: string): StudentProfile | null =>
  store.getAll().find((s) => s.email.toLowerCase() === email.toLowerCase()) ?? null;

export const getStudentByGithub = (username: string): StudentProfile | null =>
  store.getAll().find(
    (s) => s.githubUsername.toLowerCase() === username.toLowerCase()
  ) ?? null;

export const createStudent = (
  data: Omit<StudentProfile, "id" | "created_at" | "passwordHash" | "is_active"> & {
    password: string;
  }
): StudentProfile => {
  const { password, ...rest } = data;
  // Guard: email must be unique
  if (getStudentByEmail(rest.email)) {
    throw new Error("EMAIL_EXISTS");
  }
  return store.add({
    ...rest,
    passwordHash: hashPassword(password),
    is_active: true,
  });
};

export const updateStudent = (
  id: string,
  updates: Partial<Omit<StudentProfile, "id" | "created_at" | "passwordHash">>
): StudentProfile | null => store.update(id, updates);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface StudentSession {
  studentId: string;
  githubUsername: string;
  name: string;
  authenticated_at: string;
}

export const signInStudent = (
  email: string,
  password: string
): StudentSession | null => {
  const student = getStudentByEmail(email);
  if (!student || !student.is_active) return null;
  if (student.passwordHash !== hashPassword(password)) return null;

  const session: StudentSession = {
    studentId: student.id,
    githubUsername: student.githubUsername,
    name: student.name,
    authenticated_at: new Date().toISOString(),
  };
  setCookie(JSON.stringify(session), COOKIE_DAYS);
  return session;
};

export const signOutStudent = () => deleteCookie();

export const getStudentSession = (): StudentSession | null => {
  const raw = getCookie();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentSession;
  } catch {
    return null;
  }
};

export const isStudentLoggedIn = (): boolean => getStudentSession() !== null;
