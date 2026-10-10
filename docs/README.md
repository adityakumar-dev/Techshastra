# TECHSHASTRA — Complete Feature Documentation

> **The official technical and entrepreneurship club of Uttarakhand Technical University, Dehradun.**
> *Innovate · Create · Dominate*

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| **Animations** | Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Local Storage** | localStorage for Projects, Blogs, Gallery, Publications |
| **Email** | EmailJS (Certificate distribution) |
| **Charts** | Recharts |
| **Spreadsheets** | SheetJS (xlsx) |
| **Live Code** | StackBlitz SDK |
| **Forms** | React Hook Form + Zod validation |

---

## 📂 Project Structure

```
remix-of-shastra-hub/
├── public/              # Static assets (favicon, gallery images)
├── src/
│   ├── assets/          # Team photos, hero backgrounds, logo
│   ├── components/      # 14 custom components + ui/ (49 shadcn components)
│   ├── hooks/           # use-mobile, use-toast
│   ├── integrations/    # Supabase client config
│   ├── lib/             # Data stores (project, blog, gallery, publication, utils)
│   ├── pages/           # 18 page components (routed via React Router)
│   ├── App.tsx          # Root app with routing
│   └── main.tsx         # Entry point
├── supabase/            # Migrations & config
├── docs/                # ← You are here
└── package.json
```

---

## 📖 Feature Index

| # | Feature | Doc | Primary Files |
|---|---------|-----|---------------|
| 01 | Hero & Landing Page | [01-HERO-AND-LANDING.md](./01-HERO-AND-LANDING.md) | `Hero.tsx`, `Index.tsx` |
| 02 | About Section | [02-ABOUT-SECTION.md](./02-ABOUT-SECTION.md) | `About.tsx` |
| 03 | Mentor Spotlight | [03-MENTOR-SPOTLIGHT.md](./03-MENTOR-SPOTLIGHT.md) | `MentorSpotlight.tsx` |
| 04 | Domains of Excellence | [04-DOMAINS.md](./04-DOMAINS.md) | `Domains.tsx` |
| 05 | Leadership Team | [05-LEADERSHIP-TEAM.md](./05-LEADERSHIP-TEAM.md) | `Team.tsx` |
| 06 | Gallery | [06-GALLERY.md](./06-GALLERY.md) | `HomeGallery.tsx`, `Gallery.tsx`, `galleryStore.ts` |
| 07 | Contact | [07-CONTACT.md](./07-CONTACT.md) | `Contact.tsx`, `Contact.tsx` (page) |
| 08 | Projects | [08-PROJECTS.md](./08-PROJECTS.md) | `Projects.tsx`, `ProjectDetail.tsx`, `ProjectLive.tsx`, `projectStore.ts` |
| 09 | Events | [09-EVENTS.md](./09-EVENTS.md) | `Events.tsx`, `EventDetail.tsx` |
| 10 | Blog & News | [10-BLOG-AND-NEWS.md](./10-BLOG-AND-NEWS.md) | `Blog.tsx`, `BlogPost.tsx`, `blogStore.ts` |
| 11 | Research & Publications | [11-PUBLICATIONS.md](./11-PUBLICATIONS.md) | `Publications.tsx`, `publicationStore.ts` |
| 12 | Learning Resources | [12-RESOURCES.md](./12-RESOURCES.md) | `Resources.tsx` |
| 13 | FAQ | [13-FAQ.md](./13-FAQ.md) | `FAQ.tsx` |
| 14 | Achievements | [14-ACHIEVEMENTS.md](./14-ACHIEVEMENTS.md) | `Achievements.tsx` |
| 15 | Join / Membership | [15-JOIN-MEMBERSHIP.md](./15-JOIN-MEMBERSHIP.md) | `Join.tsx` |
| 16 | Admin Panel | [16-ADMIN-PANEL.md](./16-ADMIN-PANEL.md) | `Admin.tsx` |
| 17 | Certificate Sender | [17-CERTIFICATE-SENDER.md](./17-CERTIFICATE-SENDER.md) | `CertificateSender.tsx` |
| 18 | Authentication | [18-AUTH.md](./18-AUTH.md) | `Auth.tsx`, `ProtectedRoute.tsx` |
| 19 | Architecture & Design System | [19-ARCHITECTURE.md](./19-ARCHITECTURE.md) | `App.tsx`, `ThemeProvider.tsx`, `index.css` |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 👥 Core Team

| Name | Role |
|------|------|
| **Dr. Sandeep Singh Negi** | Club Mentor & Founding Visionary |
| **Akhilesh Raje** | President — Strategy & Architecture |
| **Amitesh Kumar** | Vice-President — Operations & Culture |
| **Pratyush Shrivastava** | CTO — Technical Infrastructure |

---

*Documentation generated on February 19, 2026.*
