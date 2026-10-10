/**
 * ContributionGraph — themed 52-week heatmap built from GitHub Events API.
 *
 * GitHub's free Events API returns the last 300 public events per user.
 * We bucket them by date to build a contribution density map.
 * It won't match GitHub's exact count (private commits excluded) but
 * gives an authentic activity signal with full theme control.
 *
 * ponytail: Events API only covers ~90 days of activity for active users.
 * Ceiling: max 300 events, public only. Upgrade: use GH OAuth token for full history.
 */

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ─── TYPES & HELPERS ─────────────────────────────────────────────────────────

interface GHEvent {
  created_at: string;
  type: string;
}

const CACHE_KEY = (u: string) => `ts_gh_cache_${u}:events`;
const CACHE_TTL = 30 * 60 * 1000;

const fetchEvents = async (username: string): Promise<GHEvent[]> => {
  // Check cache
  try {
    const raw = localStorage.getItem(CACHE_KEY(username));
    if (raw) {
      const { data, expires } = JSON.parse(raw);
      if (Date.now() < expires) return data as GHEvent[];
    }
  } catch { /* ignore */ }

  const res = await fetch(
    `https://api.github.com/users/${username}/events/public?per_page=100`,
    { headers: { Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return [];
  const data = await res.json() as GHEvent[];

  try {
    localStorage.setItem(CACHE_KEY(username), JSON.stringify({ data, expires: Date.now() + CACHE_TTL }));
  } catch { /* quota */ }

  return data;
};

/** Build a map of dateString → count for the last 52 weeks */
const buildDayMap = (events: GHEvent[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10); // "YYYY-MM-DD"
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
};

/** Generate the last N weeks as an array of week-arrays of date strings */
const buildWeeks = (numWeeks: number): string[][] => {
  const today = new Date();
  // Start from the most recent Sunday, go back numWeeks weeks
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay() - (numWeeks - 1) * 7);

  const weeks: string[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + w * 7 + d);
      week.push(date.toISOString().slice(0, 10));
    }
    weeks.push(week);
  }
  return weeks;
};

/** Map count to an intensity level 0-4 */
const intensity = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
};

// Tailwind classes for each intensity level — uses primary colour tones
// Light theme: soft wine tones. Dark theme: brighter wine tones.
const CELL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-foreground/[0.06] dark:bg-white/[0.05]",
  1: "bg-primary/20",
  2: "bg-primary/40",
  3: "bg-primary/65",
  4: "bg-primary",
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS   = ["Sun","","Tue","","Thu","","Sat"];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface Props {
  username: string;
}

const ContributionGraph = ({ username }: Props) => {
  const [dayMap, setDayMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const NUM_WEEKS = 52;

  useEffect(() => {
    setLoading(true);
    fetchEvents(username).then((events) => {
      const map = buildDayMap(events);
      const sum = Array.from(map.values()).reduce((a, b) => a + b, 0);
      setDayMap(map);
      setTotal(sum);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username]);

  const weeks = buildWeeks(NUM_WEEKS);

  // Build month label positions
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const month = new Date(week[0]).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTH_LABELS[month], col: wi });
      lastMonth = month;
    }
  });

  const formatDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/40 font-light">
          {loading ? "Loading activity…" : `${total} public events in the last year`}
        </span>
        <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-foreground/30 hover:text-primary transition-colors font-light">
          View on GitHub ↗
        </a>
      </div>

      {/* Graph */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: "660px" }}>
          {/* Month labels */}
          <div className="flex mb-1 pl-8">
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find((m) => m.col === wi);
              return (
                <div key={wi} className="flex-1 text-[9px] text-foreground/40 font-light leading-none">
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Grid: 7 rows (days) × 52 cols (weeks) */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-1.5">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="h-[10px] w-6 text-[9px] text-foreground/30 font-light leading-none flex items-center justify-end">
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day) => {
                  const count = dayMap.get(day) ?? 0;
                  const level = intensity(count);
                  const isFuture = day > new Date().toISOString().slice(0, 10);
                  return (
                    <Tooltip key={day}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-[10px] w-[10px] rounded-[2px] transition-colors duration-200 ${
                            isFuture
                              ? "opacity-0"
                              : CELL_CLASSES[level]
                          }`}
                        />
                      </TooltipTrigger>
                      {!isFuture && (
                        <TooltipContent side="top" className="text-xs font-light">
                          {count === 0
                            ? `No activity · ${formatDate(day)}`
                            : `${count} event${count > 1 ? "s" : ""} · ${formatDate(day)}`}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[9px] text-foreground/30 font-light">Less</span>
            {([0, 1, 2, 3, 4] as const).map((l) => (
              <div key={l} className={`h-[10px] w-[10px] rounded-[2px] ${CELL_CLASSES[l]}`} />
            ))}
            <span className="text-[9px] text-foreground/30 font-light">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
