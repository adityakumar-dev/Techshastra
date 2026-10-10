# 10 — Blog & News

## What It Is

A full **content management system** for blog posts, news, and announcements, comprising:

1. **Blog listing page** (`/blog`): Filterable grid of published posts with category tabs (All / Blog / News / Announcements).
2. **Blog post page** (`/blog/:slug`): Individual post with full rendered content, featured image, author, date, and category badge.
3. **Admin management**: Create, edit, publish/unpublish, and delete posts from the Admin panel.

### Post Categories
| Category | Icon | Badge Style |
|----------|------|-------------|
| Blog | FileText | Primary (green) |
| News | Newspaper | Blue |
| Announcement | Megaphone | Amber |

### Data Model
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;         // URL-safe, auto-generated from title
  excerpt: string;
  content: string;      // Markdown supported
  image_url: string;
  category: "blog" | "news" | "announcement";
  author: string;
  published: boolean;   // Draft/Published toggle
  published_at: string; // ISO date
}
```

## Why It Was Built — The Story

A website without fresh content becomes stale. The blog system gives TECHSHASTRA a **voice**:

- **News**: Event announcements, lab openings, partnership updates.
- **Blog**: Technical tutorials written by members (e.g., "Mastering React & Supabase").
- **Announcements**: Official club communications.

The **category filter tabs** were designed so visitors can quickly find what they care about. The **publish/unpublish toggle** in Admin lets the team draft posts before releasing them.

3 sample posts are hardcoded as seeds to ensure the blog never looks empty, even before Admin adds any content.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Blog.tsx` | Blog listing with category filters |
| `src/pages/BlogPost.tsx` | Individual post view |
| `src/lib/blogStore.ts` | Blog data store (localStorage + 3 sample posts) |

### Technical Details

1. **Storage**: `localStorage` (`techshastra_blog_posts`) + 3 hardcoded sample posts merged and sorted by `created_at`.
2. **Slug generation**: `generateSlug()` converts titles to URL-safe slugs with collision detection (appends timestamp if duplicate).
3. **Filtering**: Category tabs filter via `posts.filter(p => p.category === activeTab)` with live count badges.
4. **Date formatting**: `date-fns`'s `format()` for human-readable dates.
5. **Image fallback**: If no image, shows a gradient placeholder with the category icon.
