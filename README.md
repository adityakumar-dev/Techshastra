<p align="center">
  <img src="src/assets/logo-full.png" alt="TECHSHASTRA Logo" width="200" />
</p>

<h1 align="center">TECHSHASTRA</h1>

<p align="center">
  <strong>Innovate · Create · Dominate</strong><br/>
  The official Technical & Entrepreneurship Club of Uttarakhand Technical University, Dehradun
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase" />
</p>

---

## 🏠 Overview

TECHSHASTRA is the dynamic website for UTU Dehradun's premier technology club. It serves as the club's **public face**, **content management system**, and **operational hub** — showcasing projects, events, research, team identity, and enabling membership applications and certificate distribution.

### Key Highlights

- 🎨 **Glassmorphism design** with light/dark theme support
- 🚀 **In-browser code execution** via StackBlitz SDK & Pyodide
- 📜 **Certificate generation engine** with Excel import and bulk email sending
- 📊 **Admin dashboard** for managing all website content
- 🔬 **Research hub** for papers and books with PDF upload/download
- 💾 **localStorage-based architecture** - No backend required!
- 📥 **Data backup system** - Export/import all data as JSON

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/remix-of-shastra-hub.git
cd remix-of-shastra-hub

# Install dependencies
npm install

# (Optional) Create environment file for EmailJS certificate feature
cp .env.example .env
# Edit .env and add your EmailJS credentials

# Start development server
npm run dev
```

---

## 🗂️ Features

| Feature | Route | Description |
|---------|-------|-------------|
| **Homepage** | `/` | Hero, About, Mentor, Domains, Team, Gallery preview, Contact |
| **Projects** | `/projects` | Project showcase with live code runner |
| **Events** | `/events` | Upcoming & past events |
| **Blog** | `/blog` | News, tutorials, and announcements |
| **Publications** | `/publications` | Research papers & books |
| **Resources** | `/resources` | Curated learning materials |
| **Gallery** | `/gallery` | Photo gallery with lightbox |
| **FAQ** | `/faq` | Frequently asked questions |
| **Achievements** | `/achievements` | Club milestones & awards |
| **Join** | `/join` | Multi-role membership application |
| **Admin** | `/admin` | Content management + certificate sender + data backup |
| **Auth** | `/auth` | Login / signup (Custom credentials) |

📚 **Detailed documentation for every feature is in the [`docs/`](docs/README.md) folder.**

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 · TypeScript 5 · Vite 5 |
| **Styling** | Tailwind CSS 3 · shadcn/ui (49 components) |
| **Animations** | Framer Motion |
| **Data Storage** | localStorage (All data client-side) |
| **Backup System** | JSON export/import functionality |
| **Emails** | EmailJS (Certificate distribution) |
| **Live Code** | StackBlitz SDK · Pyodide |
| **Spreadsheets** | SheetJS (xlsx) |
| **Forms** | React Hook Form · Zod |

---

## 📁 Project Structure

```
remix-of-shastra-hub/
├── docs/                # 📚 Feature documentation (19 files)
├── public/              # Static assets
├── src/
│   ├── assets/          # Images (team photos, hero bg, logo)
│   ├── components/      # 14 custom + 49 shadcn/ui components
│   │   └── ui/          # shadcn/ui component library
│   ├── hooks/           # use-mobile, use-toast
│   ├── lib/             # Data stores & utilities
│   │   ├── stores/      # Individual entity stores (events, achievements, etc.)
│   │   ├── localStore.ts      # Unified localStorage CRUD system
│   │   ├── dataBackup.ts      # Export/import functionality
│   │   ├── projectStore.ts    # Projects data
│   │   ├── blogStore.ts       # Blog posts data
│   │   ├── galleryStore.ts    # Gallery images data
│   │   ├── publicationStore.ts # Research papers & books data
│   │   └── utils.ts
│   ├── pages/           # 18 route pages
│   ├── App.tsx          # Root routing
│   └── main.tsx         # Entry point
├── package.json
└── README.md            # ← You are here
```

---

## 💾 Data Architecture

**localStorage-Only Design**
- All data stored in browser localStorage
- No backend server or database required
- Zero hosting costs
- Lightning-fast performance (no network calls)
- ~10MB storage limit per domain (sufficient for typical club data)

**Data Stores:**
- Projects, Blog, Gallery, Publications
- Events, Achievements, FAQs
- Contact Messages, Social Posts
- Admin Credentials, Activity Logs

**Backup System:**
- Export all data as JSON file from Admin panel
- Import data from backup file
- Prevents data loss on browser cache clear
- Easy data migration between environments

**Trade-offs:**
- ✅ Pros: Simple, fast, no costs, no server maintenance
- ⚠️ Cons: Data is per-browser, cleared on cache clear
- 💡 Solution: Regular backups via export feature

---

## 👥 Core Team

| Name | Role | Responsibility |
|------|------|----------------|
| **Dr. Sandeep Singh Negi** | Mentor | Academic coordination & founding vision |
| **Akhilesh Raje** | President | Strategy, architecture & admin-level authority |
| **Amitesh Kumar** | Vice-President | Operations, culture & internal orchestration |
| **Pratyush Shrivastava** | CTO | Technical infrastructure & systems leadership |

---

## 📖 Documentation

Comprehensive docs are in the **[`docs/`](docs/README.md)** folder:

| # | Document | Topic |
|---|----------|-------|
| 01 | [Hero & Landing](docs/01-HERO-AND-LANDING.md) | Homepage hero section |
| 02 | [About Section](docs/02-ABOUT-SECTION.md) | Mission, vision, stats |
| 03 | [Mentor Spotlight](docs/03-MENTOR-SPOTLIGHT.md) | Dr. Negi's profile |
| 04 | [Domains](docs/04-DOMAINS.md) | 9 tech domains |
| 05 | [Leadership Team](docs/05-LEADERSHIP-TEAM.md) | President, VP, CTO |
| 06 | [Gallery](docs/06-GALLERY.md) | Photo gallery system |
| 07 | [Contact](docs/07-CONTACT.md) | Contact info & social |
| 08 | [Projects](docs/08-PROJECTS.md) | Project showcase + live runner |
| 09 | [Events](docs/09-EVENTS.md) | Events & workshops |
| 10 | [Blog & News](docs/10-BLOG-AND-NEWS.md) | Content management |
| 11 | [Publications](docs/11-PUBLICATIONS.md) | Research papers & books |
| 12 | [Resources](docs/12-RESOURCES.md) | Curated learning links |
| 13 | [FAQ](docs/13-FAQ.md) | Frequently asked questions |
| 14 | [Achievements](docs/14-ACHIEVEMENTS.md) | Club milestones |
| 15 | [Join / Membership](docs/15-JOIN-MEMBERSHIP.md) | Application form |
| 16 | [Admin Panel](docs/16-ADMIN-PANEL.md) | Content dashboard |
| 17 | [Certificate Sender](docs/17-CERTIFICATE-SENDER.md) | Bulk cert generation |
| 18 | [Authentication](docs/18-AUTH.md) | Supabase auth |
| 19 | [Architecture](docs/19-ARCHITECTURE.md) | Design system & patterns |

---

## 🚀 Available Scripts

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 🚀 Deployment

**Recommended: Vercel (Zero Config)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Why Vercel:**
- Zero configuration for Vite projects
- Automatic HTTPS
- Global CDN
- Free tier: 100GB bandwidth/month
- No backend = no additional costs

**Alternative Options:**
- **Netlify**: Similar to Vercel, drag-and-drop deployment
- **GitHub Pages**: Free hosting for static sites
- **Any static host**: Cloudflare Pages, Render, etc.

**Build Output:**
- Run `npm run build`
- Deploy the `dist/` folder to any static hosting

---

## 💡 Admin Panel Features

**Content Management:**
- Add/Edit/Delete: Projects, Blog Posts, Events, Achievements, FAQs, Gallery Images
- Custom admin credential system (no signup required)
- Activity log tracking all admin actions

**Certificate Sender:**
- Upload Excel file with recipient data
- Design certificate with drag-and-drop fields
- Bulk generate and email certificates via EmailJS
- Support for Hindi/Devanagari fonts

**Data Backup:**
- Export all data as JSON file
- Import backup to restore data
- Storage size monitoring
- One-click data clearing

**Super Admin Controls:**
- Create admin credentials
- Block/unblock admins
- Activity log with revert functionality
- Page visibility toggles

---

## 🔐 Security Notes

**Custom Auth System:**
- No traditional signup - admins created via super admin panel
- Credentials generated from: name + mobile + DOB
- Session stored in sessionStorage
- Super admin hardcoded (see `src/lib/adminStore.ts`)

**Important:**
- Change super admin credentials before deployment
- Regularly export data backups
- Don't share admin credentials publicly

---

## 📊 Data Management

**Adding Initial Data:**
1. Login to admin panel (`/auth`)
2. Use respective tabs to add content
3. Export backup for safekeeping

**Migrating Data:**
1. Export from old environment
2. Import in new environment
3. Verify all content loaded correctly

**Browser Storage Limits:**
- localStorage: ~10MB per domain
- Typical usage: 1-2MB for full club data
- Monitor via Admin → Data Backup section

---

## 🐛 Troubleshooting

**Data disappeared:**
- Browser cache was cleared
- Import latest backup from Admin panel

**Admin can't login:**
- Check if credentials are correct
- Verify session in sessionStorage
- Try clearing browser cache and logging in again

**Build fails:**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npm run lint`
- Delete `node_modules` and `package-lock.json`, reinstall

**Images not loading:**
- Check if image URLs are valid
- For base64 images, ensure size is reasonable (<500KB)
- Consider using external image hosting for large files

---

## 📄 License

This project is maintained by **TECHSHASTRA, UTU Dehradun**. All rights reserved.

---

<p align="center">
  <em>Built with ❤️ by the TECHSHASTRA team</em>
</p>
