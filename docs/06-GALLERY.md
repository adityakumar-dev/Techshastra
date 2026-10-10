# 06 — Gallery

## What It Is

A **two-part gallery system**:

1. **HomeGallery** (homepage): Shows 6 preview images in a staggered grid with hover overlays. A "View Full Gallery" button links to the dedicated page.
2. **Gallery Page** (`/gallery`): Full responsive masonry grid of all images with click-to-enlarge lightbox dialog.

## Why It Was Built — The Story

A tech club's credibility is amplified by **visual proof** — photos of events, hackathons, workshops, and team activities. The gallery accomplishes three things:

1. **Social proof**: "Look, real things happen here."
2. **Engagement**: The **staggered grid** on the homepage (alternating row offsets with `md:translate-y-8`) creates visual rhythm that draws the eye.
3. **FOMO**: Seeing vibrant workshop photos motivates prospective members to join.

The lightbox dialog (powered by Radix `<Dialog>`) lets visitors zoom in on any image without leaving the page.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/HomeGallery.tsx` | Homepage gallery preview (6 images) |
| `src/pages/Gallery.tsx` | Full gallery page with lightbox |
| `src/lib/galleryStore.ts` | Gallery data store (localStorage + hardcoded) |

### Technical Details

1. **Data source**: `galleryStore.ts` combines hardcoded seed images with admin-uploaded images stored in `localStorage` under key `techshastra_gallery`.
2. **Homepage preview**: `getAllGalleryImages().slice(0, 6)` — only shows 6 images.
3. **Hover effect**: Gradient overlay from `from-black/80 via-transparent to-transparent` appears on hover with the image title.
4. **Lightbox**: Radix `<Dialog>` component wrapping a full-size image with gradient caption bar.
5. **Loading state**: Skeleton grid (`animate-pulse`) while data loads.
