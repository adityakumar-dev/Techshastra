# 02 — About Section

## What It Is

A two-column section on the homepage that introduces TECHSHASTRA with:

- **Left column**: Mission, Vision, founding info ("Est. 2023 · UTU Dehradun"), and stats (15+ Domains, 500+ Innovators, 50+ Deployments)
- **Right column**: An animated visual centrepiece featuring the club logo inside concentric rings with floating orbital data cards and a multi-layered pulsing glow

## Why It Was Built — The Story

New visitors need to immediately understand **what TECHSHASTRA is** and **why it matters**. Rather than a bland text block, the team wanted a split layout:

- The **left side** answers "What do they do?" with mission/vision cards and quantified proof (15+ domains, 500+ innovators).
- The **right side** creates visual intrigue with the logo orbited by floating data cards — communicating the concept of an **innovation ecosystem** revolving around a central core.
- The quote *"Bridging the gap between academic theory and industry dominance"* is attributed to **Dr. Sandeep Singh Negi**, the founding mentor, to lend academic credibility.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/About.tsx` | Full about section component |
| `src/assets/logo-full.png` | Club logo displayed in the centre |

### Technical Details

1. **Framer Motion**: The entire left column slides in from the left (`x: -30 → 0`) on scroll via `whileInView`. The right-side orbital cards use perpetual `animate` loops with different durations and delays.
2. **Rotating ring**: An outer dashed-border ring rotates 360° on a 25-second infinite loop.
3. **Pulsing glow**: Two `motion.div` elements with `blur-[100px]` and `blur-[80px]` pulse out of phase for a "breathing" background glow.
4. **Section anchor**: Uses `id="about"` so the Navbar's "About" link scrolls to this section.
