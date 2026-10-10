# 11 — Research & Publications

## What It Is

A dedicated section (`/publications`) for sharing **research papers and books** produced or curated by TECHSHASTRA members. Features include:

- **Search bar**: Filter by title, author, or description
- **Publication cards**: Split layout with type icon (Book 📘 / Paper 📄), badge, year, title, authors, description
- **Action buttons**: "View Source" (external link) and "Download PDF" (base64 file download)

### Data Model
```typescript
type PublicationType = "paper" | "book";

interface Publication {
  id: string;
  title: string;
  authors: string;
  description: string;
  type: PublicationType;
  link_url?: string;    // External URL
  file_url?: string;    // Base64-encoded PDF
  published_at: string;
}
```

## Why It Was Built — The Story

This feature was implemented in conversation `7780f483` specifically because TECHSHASTRA wanted to position itself as **more than a coding club** — it's an academic ecosystem. Features built:

1. **Research visibility**: Faculty and student research papers get a permanent home on the website.
2. **PDF upload support**: Admin can upload PDFs that are stored as base64 in localStorage, making them downloadable without external hosting.
3. **Link support**: External links to published papers (IEEE, ArXiv, etc.).
4. **Search**: Given the academic audience, a search bar was essential for finding papers by author or topic.

This was one of the last major features added to the site, directly requested to elevate the club's academic profile.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Publications.tsx` | Publications listing page |
| `src/lib/publicationStore.ts` | Publication data store (localStorage) |

### Technical Details

1. **Storage**: Pure `localStorage` (`techshastra_publications`) — no hardcoded seeds.
2. **Admin management**: Publications tab in Admin panel handles create/delete with type selection (paper/book), file upload, and link input.
3. **File handling**: PDFs are read as `DataURL` (base64) and stored directly in localStorage.
4. **Type differentiation**: Books get a blue icon/badge, papers get the primary (green) colour.
