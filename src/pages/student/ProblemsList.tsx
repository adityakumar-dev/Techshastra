import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getProblemsCatalog,
  getUserSubmissions,
  enrichProblem,
  type Problem,
  type Submission,
} from "@/lib/codingStore";
import { getPublishedProblems } from "@/lib/services/problemService";
import { getStudentByGithub, getStudentById } from "@/lib/studentStore";
import { getStudentByUserId, getStudentByUsername } from "@/lib/services/studentService";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Code2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStudentAuth } from "@/hooks/useStudentAuth";

export const ProblemsList: React.FC = () => {
  const { session } = useStudentAuth();
  const currentStudentId = session?.studentId || session?.githubUsername;

  const [problems, setProblems] = useState<Problem[]>(() => getProblemsCatalog());
  const [submissions, setSubmissions] = useState<Submission[]>(() => getUserSubmissions(currentStudentId));
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [studentProfile, setStudentProfile] = useState<{ year?: string | null; course?: string | null } | null>(null);

  // Load student profile to get registered academic year & course
  useEffect(() => {
    if (!session) return;
    if (session.githubUsername) {
      const local = getStudentByGithub(session.githubUsername);
      if (local && local.year) {
        setStudentProfile({ year: local.year, course: local.course });
        return;
      }
    }
    if (session.studentId) {
      const local = getStudentById(session.studentId);
      if (local && local.year) {
        setStudentProfile({ year: local.year, course: local.course });
        return;
      }
    }
    // Remote fallback
    if (session.studentId) {
      getStudentByUserId(session.studentId).then((res) => {
        if (res && res.year) {
          setStudentProfile({ year: res.year, course: res.course });
        }
      }).catch(() => {});
    } else if (session.githubUsername) {
      getStudentByUsername(session.githubUsername).then((res) => {
        if (res && res.year) {
          setStudentProfile({ year: res.year, course: res.course });
        }
      }).catch(() => {});
    }
  }, [session]);

  // Standardize student's academic year (e.g., "2nd Year")
  const studentAcademicYear = useMemo(() => {
    if (!studentProfile?.year) return null;
    const raw = studentProfile.year.trim().toLowerCase();
    if (raw.includes("1") || raw.includes("first")) return "1st Year";
    if (raw.includes("2") || raw.includes("second")) return "2nd Year";
    if (raw.includes("3") || raw.includes("third")) return "3rd Year";
    if (raw.includes("4") || raw.includes("fourth") || raw.includes("final")) return "4th Year";
    return null;
  }, [studentProfile]);

  useEffect(() => {
    let active = true;
    getPublishedProblems().then((fresh) => {
      if (active && fresh && fresh.length > 0) {
        setProblems(fresh.map(enrichProblem));
      }
    });

    const onUpdate = () => {
      setProblems(getProblemsCatalog());
      setSubmissions(getUserSubmissions(currentStudentId));
    };
    window.addEventListener("ts_coding_problems_updated", onUpdate);
    return () => {
      active = false;
      window.removeEventListener("ts_coding_problems_updated", onUpdate);
    };
  }, [currentStudentId]);

  useEffect(() => {
    setSubmissions(getUserSubmissions(currentStudentId));
  }, [currentStudentId]);

  // Map solved status
  const solvedProblemIds = useMemo(() => {
    return new Set(
      submissions.filter((s) => s.status === "Accepted").map((s) => s.problemId)
    );
  }, [submissions]);

  const attemptedProblemIds = useMemo(() => {
    return new Set(submissions.map((s) => s.problemId));
  }, [submissions]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [problems]);

  // Cohort matching helper
  const matchesStudentCohort = useMemo(() => {
    return (prob: Problem) => {
      const probCohort = prob.targetYear || prob.targetSemester;
      // If problem is marked for All or All Years, or unspecified, visible to everyone
      if (!probCohort || probCohort === "All" || probCohort === "All Years" || probCohort === "All Semesters") {
        return true;
      }
      // If student is not logged in or has no academic year recorded, show all
      if (!studentAcademicYear) {
        return true;
      }
      // Normalize problem cohort
      const cleanProb = probCohort.trim().toLowerCase();
      let probYear: string | null = null;
      if (cleanProb.includes("1") || cleanProb.includes("first") || cleanProb.includes("sem 1") || cleanProb.includes("sem 2")) {
        probYear = "1st Year";
      } else if (cleanProb.includes("2") || cleanProb.includes("second") || cleanProb.includes("sem 3") || cleanProb.includes("sem 4")) {
        probYear = "2nd Year";
      } else if (cleanProb.includes("3") || cleanProb.includes("third") || cleanProb.includes("sem 5") || cleanProb.includes("sem 6")) {
        probYear = "3rd Year";
      } else if (cleanProb.includes("4") || cleanProb.includes("fourth") || cleanProb.includes("final") || cleanProb.includes("sem 7") || cleanProb.includes("sem 8")) {
        probYear = "4th Year";
      }
      return probYear === studentAcademicYear;
    };
  }, [studentAcademicYear]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Search
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      // Difficulty
      const matchesDifficulty =
        difficultyFilter === "All" || p.difficulty === difficultyFilter;

      // Cohort matching based on student's registered year (automatic)
      const matchesCohort = matchesStudentCohort(p);

      // Status
      const isSolved = solvedProblemIds.has(p.id);
      const isAttempted = attemptedProblemIds.has(p.id);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Solved" && isSolved) ||
        (statusFilter === "Unsolved" && !isSolved) ||
        (statusFilter === "Attempted" && isAttempted && !isSolved);

      // Tag
      const matchesTag =
        selectedTag === "All" || p.tags.includes(selectedTag);

      return matchesSearch && matchesDifficulty && matchesCohort && matchesStatus && matchesTag;
    });
  }, [
    problems,
    search,
    difficultyFilter,
    matchesStudentCohort,
    statusFilter,
    selectedTag,
    solvedProblemIds,
    attemptedProblemIds,
  ]);

  const getDifficultyColor = (diff: Problem["difficulty"]) => {
    switch (diff) {
      case "Easy":
        return "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/40 font-medium";
      case "Medium":
        return "text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/40 font-medium";
      case "Hard":
        return "text-rose-800 dark:text-rose-300 bg-rose-500/15 border-rose-500/40 font-medium";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Code2 className="text-primary" size={24} />
            Faculty Assignments & Problems
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Solve curated algorithmic challenges, verify your test-case outputs,
            and earn points towards your campus standing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {studentAcademicYear && (
            <Badge
              variant="outline"
              className="text-xs px-3 py-1 font-medium border-purple-500/40 text-purple-900 dark:text-purple-300 bg-purple-500/15 flex items-center gap-1.5 shadow-xs"
            >
              <GraduationCap size={13} className="text-purple-600 dark:text-purple-400" />
              <span>Your Curriculum: <strong>{studentAcademicYear}</strong>{studentProfile?.course ? ` · ${studentProfile.course}` : ""}</span>
            </Badge>
          )}
          <Badge variant="outline" className="text-xs px-3 py-1 font-normal">
            Problems: <span className="font-semibold ml-1">{filteredProblems.length}</span>
          </Badge>
          <Badge variant="outline" className="text-xs px-3 py-1 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            Solved: <span className="font-semibold ml-1">{solvedProblemIds.size}</span>
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass p-3.5 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems, keywords, or topics..."
            className="pl-9 h-9 rounded-xl text-xs bg-background/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Filter */}
          <div className="flex items-center rounded-xl glass border border-white/30 dark:border-white/10 p-1 text-xs">
            {["All", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  difficultyFilter === diff
                    ? "bg-primary text-primary-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl glass border border-white/30 dark:border-white/10 p-1 text-xs">
            {["All", "Solved", "Unsolved"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Tags Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-muted-foreground text-xs flex items-center gap-1 mr-1 shrink-0">
          <Tag size={13} /> Topics:
        </span>
        <button
          onClick={() => setSelectedTag("All")}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
            selectedTag === "All"
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          All Topics
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              selectedTag === tag
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Problems List / Table */}
      <div className="space-y-2.5">
        {filteredProblems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass">
            <Code2 size={32} className="mx-auto text-muted-foreground mb-3" />
            <h3 className="font-heading font-medium text-foreground">
              {problems.length === 0 ? "No Problems Published Yet" : "No problems found"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {problems.length === 0
                ? "Faculty administrators haven't published any coding challenges yet. Check back soon!"
                : "Try adjusting your search criteria, difficulty filter, or tag selection."}
            </p>
          </div>
        ) : (
          filteredProblems.map((prob) => {
            const isSolved = solvedProblemIds.has(prob.id);
            const isAttempted = attemptedProblemIds.has(prob.id);

            return (
              <div
                key={prob.id}
                className="group p-4 rounded-xl glass hover:bg-primary/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Status Icon */}
                  <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                    {isSolved ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : isAttempted ? (
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground/50 flex items-center justify-center text-xs font-mono">
                        ○
                      </div>
                    )}
                  </div>

                  {/* Title & metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/student/problems/${prob.id}`}
                        className="font-heading font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors hover:underline"
                      >
                        {prob.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 ${getDifficultyColor(
                          prob.difficulty
                        )}`}
                      >
                        {prob.difficulty}
                      </Badge>

                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-purple-500/30 text-purple-800 dark:text-purple-300 bg-purple-500/10 font-medium flex items-center gap-1"
                      >
                        <GraduationCap size={11} />
                        {prob.targetYear && prob.targetYear !== "All"
                          ? prob.targetYear
                          : prob.targetSemester && prob.targetSemester !== "All"
                          ? prob.targetSemester
                          : "All Years"}
                      </Badge>

                      <span className="text-[10px] text-muted-foreground font-mono">
                        +{prob.points} pts
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {prob.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {prob.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.2 rounded-md bg-muted text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted-foreground/70 ml-2">
                        Author: {prob.author}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0">
                  <div className="text-right hidden lg:block">
                    <p className="text-[10px] text-muted-foreground">Test cases</p>
                    <p className="text-xs font-mono font-medium text-foreground">
                      {prob.testCases.length} tests ({prob.testCases.filter(tc => !tc.isHidden).length} public)
                    </p>
                  </div>

                  <Link to={`/student/problems/${prob.id}`}>
                    <Button
                      size="sm"
                      variant={isSolved ? "outline" : "default"}
                      className="rounded-xl gap-1 text-xs"
                    >
                      <span>{isSolved ? "Review Code" : "Solve Challenge"}</span>
                      <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProblemsList;
