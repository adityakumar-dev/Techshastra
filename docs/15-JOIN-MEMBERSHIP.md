# 15 — Join / Membership Application

## What It Is

A full-featured application form (`/join`) for joining TECHSHASTRA as a **Student**, **Mentor**, or **Partner**. Features:

- **Three role tabs** with distinct form fields
- **Multi-select interests** (AI/ML, Web Dev, Cybersecurity, Data Science, IoT, Entrepreneurship)
- **Validation** via React Hook Form + Zod schemas
- **Success animation** — confetti-style confirmation with next-steps info
- **Toast notifications** on submission

### Form Fields (Student)
| Field | Type | Required |
|-------|------|----------|
| Full Name | text | ✅ |
| Email | email | ✅ |
| Phone | tel | ✅ |
| Year of Study | select | ✅ |
| Branch | text | ✅ |
| Interests | multi-select | ✅ (min 1) |
| Motivation | textarea | ✅ (min 50 chars) |
| Agreement | checkbox | ✅ |

## Why It Was Built — The Story

The "Join Now" button on the Hero and Navbar needed somewhere to go. The form was designed to be:

1. **Multi-role**: Not just students — mentors (industry/faculty) and partners (companies/startups) can apply.
2. **Rigorous**: Zod validation ensures meaningful submissions (50+ character motivation, valid email/phone).
3. **Professional**: The tabbed layout and form quality signal that TechShastra takes membership seriously.
4. **Celebratory**: The success screen with "Your Application Has Been Submitted!" and a check-email CTA makes applicants feel welcomed.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Join.tsx` | Join application form |

### Technical Details

1. **Form library**: `react-hook-form` with `@hookform/resolvers/zod` for schema validation.
2. **Multi-select**: Custom implementation using shadcn `Badge` components — click to toggle interests on/off.
3. **Submission**: Currently stores in memory / logs to console — no backend submission endpoint configured.
4. **Animated transition**: Form slides out and success state slides in on submit.
5. **Date display**: Shows "Application Date" with the current date.
