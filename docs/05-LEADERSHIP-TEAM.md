# 05 — Leadership Team

## What It Is

A homepage section displaying the 3 core leadership team members in a card grid:

| Name | Role | Icon |
|------|------|------|
| Amitesh Kumar | Vice-President | Users |
| Akhilesh Raje | President | Crown |
| Pratyush Shrivastava | Chief Technology Officer | Award |

Each card features a **grayscale portrait** that transitions to colour on hover with a 110% zoom, a ring accent, role-based icon, and description.

## Why It Was Built — The Story

The leadership section establishes **who runs the club**. The intentional design decisions:

- **Akhilesh Raje (President)** is centred in the grid with a `Crown` icon, elevated shadow, and a permanently visible primary-colour accent — visual hierarchy signals authority.
- The **VP and CTO** flank the President with subtler accents.
- The **grayscale-to-colour hover effect** (refined in conversation `cffd6f55`) adds an interactive reveal that makes visitors linger on each face.
- Each member's description uses institutional language ("Admin-level authority", "Technical Infrastructure", "Internal orchestration") to set a professional tone.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/Team.tsx` | Team section component |
| `src/assets/akhilesh.jpg` | President's photo |
| `src/assets/amitesh.jpg` | VP's photo |
| `src/assets/pratyush.jpg` | CTO's photo |

### Technical Details

1. **Data**: Hardcoded `teamMembers` array with `special` flags: `"president"`, `"vp"`, `"cto"`.
2. **President differentiation**: `shadow-shadow-elevated`, `hover:scale-[1.04]`, permanent Crown icon colouring, and a thicker ring.
3. **CTO accent**: A subtle horizontal line (`w-20 h-px bg-primary/20`) at the top-left.
4. **Image sizing**: `w-32 h-32` circular avatar with `ring-2` border.
