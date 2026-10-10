# 09 — Events & Workshops

## What It Is

A dedicated page (`/events`) showcasing **upcoming and past events** including:

- **Upcoming events**: Cards with image, type badge (Workshop/Hackathon/Seminar), status badge, date/time/location/capacity, and a register button.
- **Past events**: Compact cards showing title, description, date, and attendee count.
- **Newsletter CTA**: A bottom banner encouraging users to join for event notifications.

### Current Events (Hardcoded)
| Event | Type | Date |
|-------|------|------|
| AI/ML Bootcamp 2025 | Workshop | March 15-17, 2025 |
| HackUTU 2025 | Hackathon | April 5-6, 2025 |
| Cybersecurity Summit | Seminar | March 28, 2025 |
| Web Dev Masterclass | Workshop | April 12, 2025 |

## Why It Was Built — The Story

Events are the **primary activity** of any tech club. This page serves multiple purposes:

1. **Recruitment funnel**: "Registration Open" buttons link to `/join`, converting event interest into membership applications.
2. **Credibility**: Past events (Tech Orientation 250+, IoT Challenge 120+, Startup Ideathon 80+) show the club has a **track record**.
3. **Urgency**: The "Registration Open" / "Coming Soon" badges create FOMO.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Events.tsx` | Events listing page |
| `src/pages/EventDetail.tsx` | Individual event page |

### Technical Details

1. **Data**: Fully hardcoded — `upcomingEvents` and `pastEvents` arrays. No database interaction.
2. **Images**: Unsplash stock images used for event cards.
3. **Register button**: Links to `/join` using an anchor tag. Disabled when status is "Coming Soon".
4. **Button glow**: `shadow-[0_0_20px_rgba(0,230,118,0.3)]` creates a neon green glow on hover.
