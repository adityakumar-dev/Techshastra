# 07 — Contact

## What It Is

A two-part contact system:

1. **Homepage Contact section** (`src/components/Contact.tsx`): Displays leadership contact cards, office location, social links, and organizational identity.
2. **Contact Page** (`/contact`, `src/pages/Contact.tsx`): A standalone page wrapping the same component.

### Information Displayed
- **3 leadership contacts**: Akhilesh Raje (President), Amitesh Kumar (VP), Pratyush Shrivastava (Secretary) — each with email and phone
- **Office location**: UTU, Post Office Chandanwadi, Prem Nagar, Sudhowala, Dehradun
- **Social links**: LinkedIn, Instagram
- **Organizational identity card**: Defines strategic contact channels (President's Office, VP's Office, CTO Board)

## Why It Was Built — The Story

The contact section was designed to feel like an **enterprise-grade "Contact Authority" page**, not a simple email form. Rationale:

- **Leadership cards first**: Prospective collaborators, industry partners, and sponsors need to know **who** to contact, not just a generic email.
- **Role-based routing**: "Strategic Queries → President's Office", "Ops & Culture → VP's Office" tells visitors where to direct different types of communication.
- **No contact form**: Deliberate — the team prefers direct email/phone contact over form submissions, reducing friction for serious inquiries.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/Contact.tsx` | Contact section component (used on homepage + standalone page) |
| `src/pages/Contact.tsx` | Wrapper page for `/contact` route |

### Technical Details

1. **Data**: All contact info is hardcoded in arrays (`contactInfo`, `socialLinks`, `leadershipContacts`).
2. **Social links**: Open in new tabs (`target="_blank" rel="noopener noreferrer"`).
3. **Glass cards**: Leadership cards use the shared `glass` utility.
4. **Responsive**: 3-column grid on desktop, stacking on mobile.
