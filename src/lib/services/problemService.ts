/**
 * Problem Service for TechShastra
 *
 * Provides CRUD operations for coding problems and assignments.
 * Persists to Supabase `coding_problems` table when configured,
 * and maintains continuous synchronization with localStorage (`ts_coding_problems`)
 * for instant sub-millisecond client renders and offline resilience.
 */

import { supabase, isSupabaseConfigured } from "../supabase/client";
import type { SupportedLanguage, TestCase } from "./codeExecutionService";

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export type TargetSemester =
  | "All"
  | "Sem 1"
  | "Sem 2"
  | "Sem 3"
  | "Sem 4"
  | "Sem 5"
  | "Sem 6"
  | "Sem 7"
  | "Sem 8";

export interface CodingProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  category: string;
  points: number;
  publishedBy: string;
  publishedAt: string;
  isPublished: boolean;
  description: string;
  constraints: string[];
  tags: string[];
  starterCode: Record<SupportedLanguage, string>;
  sampleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  testCases?: TestCase[];
  examples?: { input: string; output: string; explanation?: string }[];
  /** Which semester students can see this problem. "All" = visible to everyone. */
  targetSemester?: TargetSemester;
}

export const PROBLEMS_STORAGE_KEY = "ts_coding_problems";

// Default starter templates generator
export function getDefaultStarterCode(): Record<SupportedLanguage, string> {
  return {
    python: `# Python 3
import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    # Read input and implement solution
    print("Output")

if __name__ == "__main__":
    solve()
`,
    javascript: `// JavaScript (Node.js)
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    // Read input and implement solution
    console.log("Output");
}

solve();
`,
    typescript: `// TypeScript
import * as fs from 'fs';

function solve(): void {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    // Read input and implement solution
    console.log("Output");
}

solve();
`,
    cpp: `// C++ 17
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Read input and implement solution
    return 0;
}
`,
    java: `// Java 17
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read input and implement solution
    }
}
`,
  };
}

// ── LOCAL STORAGE HELPERS ───────────────────────────────────────────────────

export function getStoredProblems(): CodingProblem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROBLEMS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read problems from localStorage:", err);
    return [];
  }
}

export function saveStoredProblems(problems: CodingProblem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROBLEMS_STORAGE_KEY, JSON.stringify(problems));
    window.dispatchEvent(new Event("ts_coding_problems_updated"));
  } catch (err) {
    console.error("Failed to save problems to localStorage:", err);
  }
}

// ── SUPABASE MAPPER ─────────────────────────────────────────────────────────

function mapRowToProblem(row: any): CodingProblem {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    difficulty: row.difficulty as ProblemDifficulty,
    category: row.category || "Algorithms",
    points: Number(row.points) || 50,
    publishedBy: row.published_by || "Faculty",
    publishedAt: row.published_at || new Date().toISOString(),
    isPublished: row.is_published ?? true,
    description: row.description || "",
    constraints: Array.isArray(row.constraints) ? row.constraints : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    starterCode: row.starter_code && Object.keys(row.starter_code).length > 0
      ? row.starter_code
      : getDefaultStarterCode(),
    sampleTestCases: Array.isArray(row.sample_test_cases) ? row.sample_test_cases : [],
    hiddenTestCases: Array.isArray(row.hidden_test_cases) ? row.hidden_test_cases : [],
    targetSemester: (row.target_semester as TargetSemester) || "All",
  };
}

function mapProblemToRow(p: CodingProblem): Record<string, any> {
  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    points: p.points,
    published_by: p.publishedBy,
    published_at: p.publishedAt,
    is_published: p.isPublished,
    description: p.description,
    constraints: p.constraints,
    tags: p.tags,
    starter_code: p.starterCode,
    sample_test_cases: p.sampleTestCases,
    hidden_test_cases: p.hiddenTestCases,
    target_semester: p.targetSemester || "All",
    updated_at: new Date().toISOString(),
  };
}

// ── SERVICE METHODS ─────────────────────────────────────────────────────────

/**
 * Get all published problems for students.
 */
export async function getPublishedProblems(): Promise<CodingProblem[]> {
  if (!isSupabaseConfigured()) {
    return getStoredProblems().filter((p) => p.isPublished);
  }

  try {
    const { data, error } = await supabase
      .from("coding_problems")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch failed, falling back to local problems:", error);
      return getStoredProblems().filter((p) => p.isPublished);
    }

    if (data && data.length > 0) {
      const mapped = data.map(mapRowToProblem);
      // Cache locally
      saveStoredProblems(mapped);
      return mapped;
    }

    // If Supabase returned empty table, check local store
    return getStoredProblems().filter((p) => p.isPublished);
  } catch (err) {
    console.error("Error fetching published problems:", err);
    return getStoredProblems().filter((p) => p.isPublished);
  }
}

/**
 * Get all problems (published and drafts) for admin and superadmin management.
 */
export async function getAllProblemsAdmin(): Promise<CodingProblem[]> {
  if (!isSupabaseConfigured()) {
    return getStoredProblems();
  }

  try {
    const { data, error } = await supabase
      .from("coding_problems")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase admin fetch failed, falling back to local:", error);
      return getStoredProblems();
    }

    if (data) {
      const mapped = data.map(mapRowToProblem);
      saveStoredProblems(mapped);
      return mapped;
    }

    return getStoredProblems();
  } catch (err) {
    console.error("Error fetching admin problems:", err);
    return getStoredProblems();
  }
}

/**
 * Get problem by ID.
 */
export async function getProblemById(id: string): Promise<CodingProblem | null> {
  const localList = getStoredProblems();
  const cached = localList.find((p) => p.id === id);

  if (!isSupabaseConfigured()) {
    return cached || null;
  }

  try {
    const { data, error } = await supabase
      .from("coding_problems")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return cached || null;
    }

    const problem = mapRowToProblem(data);
    return problem;
  } catch {
    return cached || null;
  }
}

/**
 * Create or update a problem.
 */
export async function saveProblem(
  problem: Omit<CodingProblem, "id"> & { id?: string }
): Promise<CodingProblem> {
  const isNew = !problem.id;
  const id = problem.id || `prob-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
  const slug =
    problem.slug ||
    problem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const fullProblem: CodingProblem = {
    ...problem,
    id,
    slug,
    isPublished: problem.isPublished ?? true,
    publishedAt: problem.publishedAt || new Date().toISOString(),
    publishedBy: problem.publishedBy || "Faculty Admin",
    starterCode: problem.starterCode || getDefaultStarterCode(),
    constraints: problem.constraints || [],
    tags: problem.tags || [],
    sampleTestCases: problem.sampleTestCases || [],
    hiddenTestCases: problem.hiddenTestCases || [],
  };

  // Update local storage immediately
  const existing = getStoredProblems();
  const index = existing.findIndex((p) => p.id === id);
  if (index >= 0) {
    existing[index] = fullProblem;
  } else {
    existing.unshift(fullProblem);
  }
  saveStoredProblems(existing);

  // Sync to Supabase
  if (isSupabaseConfigured()) {
    try {
      const row = mapProblemToRow(fullProblem);
      if (isNew) {
        await supabase.from("coding_problems").insert(row);
      } else {
        await supabase.from("coding_problems").update(row).eq("id", id);
      }
    } catch (err) {
      console.warn("Failed to sync problem to Supabase:", err);
    }
  }

  return fullProblem;
}

/**
 * Delete a problem.
 */
export async function deleteProblem(id: string): Promise<boolean> {
  // Update local storage
  const existing = getStoredProblems();
  const filtered = existing.filter((p) => p.id !== id);
  saveStoredProblems(filtered);

  // Sync with Supabase
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("coding_problems").delete().eq("id", id);
    } catch (err) {
      console.warn("Failed to delete problem from Supabase:", err);
    }
  }

  return true;
}

/**
 * Toggle problem publish status.
 */
export async function toggleProblemPublish(id: string, isPublished: boolean): Promise<boolean> {
  const existing = getStoredProblems();
  const prob = existing.find((p) => p.id === id);
  if (prob) {
    prob.isPublished = isPublished;
    saveStoredProblems(existing);
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from("coding_problems")
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (err) {
      console.warn("Failed to toggle publish on Supabase:", err);
    }
  }

  return true;
}
