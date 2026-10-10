# 12 — Learning Resources

## What It Is

A curated page (`/resources`) of external learning materials — tutorials, documentation, videos, and tools. Each resource card shows:

- Category icon (BookOpen / FileText / Video / Code)
- Difficulty badge (beginner 🟢 / intermediate 🟡 / advanced 🔴)
- Title, description, and a "Visit Resource" button

## Why It Was Built — The Story

TECHSHASTRA wanted to be more than just events and projects — it should also **guide learning**. The Resources page acts as a **curated directory** of the best free learning materials across tech domains.

Unlike blogs (which are club-authored), resources are **external links** — tutorials from YouTube, docs from MDN, tools from GitHub, etc. This is the club's way of saying: *"Here's where to start."*

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Resources.tsx` | Resources listing page |

### Technical Details

1. **Data source**: **Supabase** — fetches from the `resources` table.
2. **Category filter**: Dynamic category buttons pulled from resource data.
3. **Difficulty colours**: `beginner → green`, `intermediate → yellow`, `advanced → red`.
4. **Loading state**: Skeleton cards with `animate-pulse` while Supabase query resolves.
5. **Empty state**: "No resources available yet." message with no category filter.

> **Note**: This is one of the pages backed by Supabase (not localStorage). Resources are managed server-side, not through the Admin panel.
