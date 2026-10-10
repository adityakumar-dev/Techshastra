/**
 * Self-check for studentStore — run with: npx tsx src/lib/studentStore.test.ts
 * Tests: hashPassword, cookie helpers (via mock), createStudent, signIn, session round-trip.
 */

// ── Minimal browser API stubs ─────────────────────────────────────────────────

let _cookies: Record<string, string> = {};
let _storage: Record<string, string> = {};

(globalThis as unknown as Record<string, unknown>).document = {
  get cookie() {
    return Object.entries(_cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  },
  set cookie(val: string) {
    const [pair] = val.split(";");
    const [k, v] = pair.split("=");
    if (v === undefined || val.includes("expires=Thu, 01 Jan 1970")) {
      delete _cookies[k.trim()];
    } else {
      _cookies[k.trim()] = v.trim();
    }
  },
};

(globalThis as unknown as Record<string, unknown>).localStorage = {
  getItem: (k: string) => _storage[k] ?? null,
  setItem: (k: string, v: string) => { _storage[k] = v; },
  removeItem: (k: string) => { delete _storage[k]; },
};

// crypto.randomUUID is native in Node 24 — no stub needed

// ── Import after stubs are set ────────────────────────────────────────────────

import {
  hashPassword,
  createStudent,
  getStudentByEmail,
  signInStudent,
  getStudentSession,
  signOutStudent,
} from "./studentStore.js";

// ── Assertions ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const assert = (label: string, condition: boolean) => {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
};

// 1. hashPassword is deterministic
assert("hashPassword is deterministic", hashPassword("hello") === hashPassword("hello"));
assert("hashPassword differs for different inputs", hashPassword("hello") !== hashPassword("world"));
assert("hashPassword returns hex string", /^[0-9a-f]+$/.test(hashPassword("test")));

// 2. createStudent stores a student
const student = createStudent({
  name: "Test Student",
  email: "test@ts.dev",
  password: "securepass123",
  githubUsername: "testoctocat",
  skills: ["React"],
  education: [],
  experience: [],
  certifications: [],
  interests: ["Web Development"],
});
assert("createStudent returns an id", typeof student.id === "string" && student.id.length > 0);
assert("createStudent does NOT store plaintext password", !JSON.stringify(student).includes("securepass123"));
assert("createStudent stores hash", student.passwordHash === hashPassword("securepass123"));
assert("createStudent is_active defaults to true", student.is_active === true);

// 3. Duplicate email throws
let threw = false;
try {
  createStudent({
    name: "Dupe",
    email: "test@ts.dev",
    password: "pass",
    githubUsername: "dupe",
    skills: [],
    education: [],
    experience: [],
    certifications: [],
    interests: [],
  });
} catch (e: unknown) {
  threw = e instanceof Error && e.message === "EMAIL_EXISTS";
}
assert("createStudent throws EMAIL_EXISTS for duplicate email", threw);

// 4. getStudentByEmail lookup
const found = getStudentByEmail("TEST@TS.DEV"); // case-insensitive
assert("getStudentByEmail is case-insensitive", found?.id === student.id);
assert("getStudentByEmail returns null for unknown", getStudentByEmail("nobody@x.com") === null);

// 5. signInStudent — wrong password
assert("signInStudent rejects wrong password", signInStudent("test@ts.dev", "wrongpass") === null);

// 6. signInStudent — correct credentials + cookie round-trip
const session = signInStudent("test@ts.dev", "securepass123");
assert("signInStudent returns session on correct credentials", session !== null);
assert("session contains correct githubUsername", session?.githubUsername === "testoctocat");

// 7. getStudentSession reads the cookie
const readBack = getStudentSession();
assert("getStudentSession reads back the session", readBack?.githubUsername === "testoctocat");
assert("getStudentSession contains studentId", typeof readBack?.studentId === "string");

// 8. signOut clears the session
signOutStudent();
assert("signOutStudent clears session", getStudentSession() === null);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
