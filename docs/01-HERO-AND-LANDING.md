# 01 — Hero & Landing Page

## What It Is

The Hero section is the full-screen landing experience visitors see when they first arrive at the TECHSHASTRA website. It features:

- **Dual-theme background images** (dark/light) that swap based on system or user preference
- **Animated ambient shapes** — blurred floating circles with `animate-float` and `animate-soft-pulse`
- **Glass-morphism content card** wrapping the description and CTA buttons
- **Stats ribbon** — "500+ members · 50+ projects · since 2023"
- **Scroll indicator** — a bouncing pill at the bottom
- Two CTA buttons: **"Join Our Community"** and **"Explore Projects"**

## Why It Was Built — The Story

The TECHSHASTRA team wanted to make a **bold first impression**. The club is Uttarakhand's flagship technical community anchored at UTU Dehradun. The hero needed to feel like a premium product landing page — not just a college club website. Every element is intentional:

- The **wide letter-spacing** on "TECHSHASTRA" gives it a luxury-brand feel.
- The **tagline "Innovate · Create · Dominate"** establishes an assertive identity.
- The **badge "Uttarakhand Technical University, Dehradun"** grounds the identity in institutional authority.
- The **glassmorphism** aesthetic was chosen to look modern and differentiate from typical college sites.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Homepage — composes all sections |
| `src/components/Hero.tsx` | Full hero section |
| `src/assets/hero-bg.jpg` | Dark mode background |
| `src/assets/hero-bg-light.jpg` | Light mode background |

### Technical Details

1. **Theme-aware backgrounds**: Uses `next-themes`' `useTheme()` hook to detect current theme and swap the background image accordingly.
2. **CSS**: The `glass` utility class (defined in `index.css`) applies `backdrop-blur`, translucent background, and subtle borders.
3. **Animations**: Tailwind custom animations (`animate-float`, `animate-soft-pulse`, `animate-bounce`) are defined in `tailwind.config.ts`.
4. **Routing**: CTA buttons link to `/join` and `/projects` via `react-router-dom`'s `<Link>`.

### Section Order on Homepage
```
Navbar → Hero → About → MentorSpotlight → Domains → Team → HomeGallery → Contact → Footer
```
