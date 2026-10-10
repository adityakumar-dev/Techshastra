# 14 — Achievements

## What It Is

A page (`/achievements`) listing the club's milestones and accomplishments. Each achievement card displays:

- A dynamic icon (Trophy 🏆 / Award 🏅 / Star ⭐ / Medal 🎖️ — cycled by index)
- Title, date, description, and optional image

## Why It Was Built — The Story

The club needed a **public trophy case** — a place to display hackathon wins, competition results, partnerships, and milestones. This serves both as:

1. **Outward proof** to prospective members and sponsors
2. **Internal motivation** for existing members

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Achievements.tsx` | Achievements listing page |

### Technical Details

1. **Data source**: **Supabase** — fetches from the `achievements` table.
2. **Icon cycling**: `[Trophy, Award, Star, Medal]` array indexed by `i % 4`.
3. **Date formatting**: `date-fns`'s `format()` for human-readable dates.
4. **Image overlay**: Achievements with images show a gradient overlay from bottom for title readability.
5. **Loading state**: Skeleton cards while Supabase query resolves.
