/**
 * GitHub REST API helpers — unauthenticated, public data only.
 * Rate limit: 60 req/hr per IP (unauthenticated).
 * ponytail: no token. Ceiling: 60 req/hr. Upgrade: add GH OAuth token via env var.
 *
 * All fetches are cached in localStorage with a 30-min TTL to survive rate limits
 * and avoid hammering the API on every page load.
 */

const BASE = "https://api.github.com";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_PREFIX = "ts_gh_cache_";

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cacheGet = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expires) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

const cacheSet = <T>(key: string, data: T): void => {
  try {
    const entry: CacheEntry<T> = { data, expires: Date.now() + CACHE_TTL_MS };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage quota — silently skip caching
  }
};

/** Clear all cached GitHub data for a user (call after profile refresh) */
export const clearGHCache = (username: string): void => {
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(CACHE_PREFIX + username)
  );
  keys.forEach((k) => localStorage.removeItem(k));
};

// ─── FETCH WITH CACHE ─────────────────────────────────────────────────────────

const ghFetch = async <T>(path: string, cacheKey: string): Promise<T> => {
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    if (res.status === 403) throw new Error("RATE_LIMITED");
    throw new Error(`GitHub API error ${res.status}`);
  }
  const data = (await res.json()) as T;
  cacheSet(cacheKey, data);
  return data;
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface GHUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GHRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  fork: boolean;
  archived: boolean;
  visibility: string;
}

export interface GHLanguageMap {
  [lang: string]: number; // bytes
}

// ─── FETCHERS ─────────────────────────────────────────────────────────────────

export const fetchGHUser = (username: string) =>
  ghFetch<GHUser>(`/users/${username}`, `${username}:user`);

/** Fetch up to 100 public repos sorted by stars (best signal for "top work") */
export const fetchGHRepos = (username: string) =>
  ghFetch<GHRepo[]>(
    `/users/${username}/repos?per_page=100&sort=pushed&type=owner`,
    `${username}:repos`
  );

/** Fetch language breakdown for one repo */
export const fetchRepoLanguages = (owner: string, repo: string) =>
  ghFetch<GHLanguageMap>(
    `/repos/${owner}/${repo}/languages`,
    `${owner}:lang:${repo}`
  );

/**
 * Aggregate language bytes across up to 30 own repos.
 * ponytail: O(repos) parallel fetches. Ceiling: 60 req/hr unauthenticated.
 * Upgrade: add GH token in env var.
 */
export const aggregateLanguages = async (
  username: string,
  repos: GHRepo[]
): Promise<GHLanguageMap> => {
  const ownRepos = repos.filter((r) => !r.fork && !r.archived).slice(0, 30);
  const results = await Promise.allSettled(
    ownRepos.map((r) => fetchRepoLanguages(username, r.name))
  );
  const totals: GHLanguageMap = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const [lang, bytes] of Object.entries(r.value)) {
        totals[lang] = (totals[lang] ?? 0) + bytes;
      }
    }
  }
  return totals;
};

/** Convert raw byte map to sorted percentage array */
export const langPercents = (
  map: GHLanguageMap
): { lang: string; pct: number; bytes: number }[] => {
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(map)
    .map(([lang, bytes]) => ({ lang, bytes, pct: Math.round((bytes / total) * 1000) / 10 }))
    .sort((a, b) => b.bytes - a.bytes);
};

/**
 * Sort repos into "pinned-equivalent" top repos:
 * own, non-archived, sorted by stars desc then forks desc.
 */
export const topRepos = (repos: GHRepo[], limit = 6): GHRepo[] =>
  repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) =>
      b.stargazers_count - a.stargazers_count ||
      b.forks_count - a.forks_count ||
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, limit);

// ─── LANGUAGE COLOURS ─────────────────────────────────────────────────────────

export const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  PowerShell: "#012456",
  Dockerfile: "#384d54",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Haskell: "#5e5086",
  R: "#198CE7",
  MATLAB: "#e16737",
  Jupyter: "#DA5B0B",
  Makefile: "#427819",
  YAML: "#cb171e",
  Other: "#8b8b8b",
};

export const langColor = (lang: string) => LANG_COLORS[lang] ?? LANG_COLORS.Other;
