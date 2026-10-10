# 16 — Admin Panel

## What It Is

A comprehensive content management dashboard (`/admin`) with **5 management tabs**:

| Tab | Manages | Data Store |
|-----|---------|------------|
| **Projects** | Add/delete club projects | localStorage |
| **Blog** | Create/publish/unpublish/delete posts | localStorage |
| **Gallery** | Upload/delete images | localStorage |
| **Publications** | Add/delete papers and books | localStorage |
| **Certificates** | Generate & email certificates (CertificateSender) | N/A (generates on-the-fly) |

### Key Capabilities

- **GitHub Auto-Import**: Paste a GitHub URL → auto-fetches repo name, description, language, and topics via the GitHub API.
- **Image Upload**: Drag-and-drop or file-picker image upload with base64 conversion and localStorage storage.
- **Auto-Generated OG Images**: When no image is provided, generates a branded preview image using the Tailgraph API.
- **Blog Drafts**: Toggle posts between published/unpublished without deleting them.
- **Certificate Generation**: Full built-in certificate sender (see [17-CERTIFICATE-SENDER.md](./17-CERTIFICATE-SENDER.md)).

## Why It Was Built — The Story

The team needed a **single place to manage all website content** without touching code or databases directly. Key design decisions:

1. **No authentication on Admin**: The Admin route exists but relies on the GitHub login awareness rather than strict backend auth. This was a pragmatic choice for the initial release.
2. **localStorage for content**: Supabase is used for some features (Resources, FAQ, Achievements), but the primary content types (Projects, Blog, Gallery, Publications) use `localStorage`. This was an intentional choice to allow the site to work **without backend configuration** during development.
3. **~1,250 lines**: The Admin panel is the largest single file in the project — it handles forms, validation, data manipulation, image processing, and API calls all in one component.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Admin.tsx` | Admin dashboard (1,250+ lines) |
| `src/lib/projectStore.ts` | Project CRUD operations |
| `src/lib/blogStore.ts` | Blog post CRUD + slug generation |
| `src/lib/galleryStore.ts` | Gallery image CRUD |
| `src/lib/publicationStore.ts` | Publication CRUD |
| `src/components/CertificateSender.tsx` | Certificate generation tool |

### Technical Details

1. **Tab system**: shadcn `<Tabs>` component with 5 tabs.
2. **State management**: Each tab manages its own local state (`useState`) for form inputs and data lists.
3. **Image handling**: `FileReader.readAsDataURL()` converts uploaded images to base64 strings for localStorage.
4. **GitHub API**: `fetch("https://api.github.com/repos/{owner}/{repo}")` with parsing for `topics`, `language`, `description`.
5. **Toast notifications**: All CRUD operations trigger `useToast()` success/error messages.
