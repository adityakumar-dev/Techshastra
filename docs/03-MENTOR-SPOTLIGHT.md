# 03 — Mentor Spotlight

## What It Is

A dedicated homepage section honouring **Dr. Sandeep Singh Negi**, the club's founding mentor and academic coordinator. It's a horizontal card with:

- **Left**: A grayscale portrait that transitions to full colour on hover (with a 105% scale zoom)
- **Right**: Name, title, and a blockquote with his founding philosophy

## Why It Was Built — The Story

TECHSHASTRA exists under the academic umbrella of UTU. **Dr. Sandeep Singh Negi** is the faculty advisor who championed the club's creation. The team wanted to:

1. **Honour his contribution** — without him, there's no club.
2. **Signal institutional backing** — visitors see this is a faculty-supported initiative, not just a student hobby.
3. **Create gravitas** — the blockquote format, italicised philosophy, and "Founding Visionary" title convey weight and seriousness.

The **grayscale-to-colour hover effect** was a specific design request (refined in conversation `cffd6f55`) to add interactive flair and visual polish to the portrait.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/MentorSpotlight.tsx` | Mentor section component |
| `src/assets/mentor.jpg` | Photo of Dr. Sandeep Singh Negi |

### Technical Details

1. **Grayscale effect**: `grayscale group-hover:grayscale-0` toggles from fully desaturated to full colour.
2. **Zoom**: `group-hover:scale-105` subtly zooms the image on card hover.
3. **Overlay**: A `bg-primary/10` overlay fades out on hover via `group-hover:bg-transparent`.
4. **Quote icon**: Lucide's `<Quote>` icon is positioned absolutely with `-rotate-12` for typographic flair.
5. **Glass card**: Uses the shared `glass` utility for the glassmorphism aesthetic.
