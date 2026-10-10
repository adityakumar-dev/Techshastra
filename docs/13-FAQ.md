# 13 — FAQ

## What It Is

A frequently asked questions page (`/faq`) displaying categorised Q&A pairs in an accordion layout. Each category is a separate section with collapsible question/answer items.

## Why It Was Built — The Story

Common questions — "How do I join?", "What events are coming up?", "Do I need to know coding?" — were getting asked repeatedly. The FAQ page reduces support load by providing **self-serve answers**, categorised for quick navigation.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/FAQ.tsx` | FAQ page with category filtering |

### Technical Details

1. **Data source**: **Supabase** — fetches from the `faqs` table (not localStorage).
2. **Grouping**: FAQs are grouped by `category` field, each rendered as a separate section.
3. **Accordion**: Uses shadcn/ui `<Accordion>` (Radix AccordionPrimitive) for collapsible Q&A.
4. **Loading state**: Skeleton blocks with `animate-pulse` while Supabase query resolves.
5. **Empty state**: "No FAQs available yet." message if Supabase returns empty.
