# 04 — Domains of Excellence

## What It Is

A homepage section that showcases TechShastra's **9 technical domains** grouped into 3 categories:

| Category | Domains |
|----------|---------|
| **Core Technology** | AI & Machine Learning, Web Development, App Development |
| **Systems & Infrastructure** | Cybersecurity, IoT & Embedded, Cloud & DevOps, Data Science, Robotics |
| **Growth & Ecosystem** | Entrepreneurship |

Each domain is a glass-morphism card with an icon, title, and short description. Featured domains (Core Technology) have enhanced hover effects.

## Why It Was Built — The Story

TECHSHASTRA is not a single-focus coding club — it spans hardware, software, AI, security, and entrepreneurship. The domains section communicates the **breadth** of what the club covers. The three categories create a narrative:

1. **Core Technology** (the "what we build")
2. **Systems & Infrastructure** (the "how we build it")
3. **Growth & Ecosystem** (the "where it goes" — startups and ventures)

The **Entrepreneurship** domain gets `fullWidth: true`, spanning the entire row to emphasise that all technical work ultimately leads to real-world impact. This mirrors the club's philosophy: tech for tech's sake isn't enough; it must translate into ventures.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/Domains.tsx` | Domain cards section |

### Technical Details

1. **Data-driven rendering**: Domains are defined in a `domainGroups` array — no Supabase or localStorage. Purely hardcoded.
2. **Icons**: Each domain maps to a Lucide icon (`Brain`, `Code`, `Shield`, `Cpu`, `Bot`, etc.)
3. **Featured cards**: Cards with `featured: true` get `hover:scale-[1.03]` and `hover:shadow-2xl` vs. the standard `hover:scale-[1.01]`.
4. **Section anchor**: Uses `id="domains"` for direct linking.
