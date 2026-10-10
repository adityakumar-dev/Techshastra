# 08 — Projects

## What It Is

A full **project showcase system** with three interconnected pages:

1. **Projects listing** (`/projects`): Grid of all projects with image, status, tech tags, team info, and action buttons.
2. **Project Detail** (`/projects/:id`): Individual project page with full description.
3. **Project Live** (`/projects/:id/live`): **In-browser code execution** using StackBlitz SDK — visitors can run JavaScript projects live, or use an embedded Python runner.

### Data Model
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  tags: string[];
  team: { lead: string; designer: string };
  github: string;
  status: "Completed" | "In Progress";
  language: "javascript" | "python" | "other";
}
```

## Why It Was Built — The Story

Projects are the **lifeblood of TECHSHASTRA**. The team wanted more than a static list — they wanted projects to be **interactive and live**:

- **"Run Live" button**: Every project has a button that opens the code in **StackBlitz** (for JS/TS projects) or a **Python runner** (for Python projects). Visitors can explore actual code without cloning a repo.
- **GitHub auto-detection**: When adding a project via the Admin panel, pasting a GitHub URL automatically fetches the repo name, description, language, and topics through the GitHub API.
- **Auto-generated images**: If no image is uploaded, a dynamic OG image is generated using the Tailgraph API with the project title.
- **Image fallback**: If the image fails to load, a `placehold.co` fallback is used.

This feature directly addresses a common problem with college club websites: *"Your project list says 'AI chatbot'... but where's the code?"*

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Projects.tsx` | Project listing page |
| `src/pages/ProjectDetail.tsx` | Individual project view |
| `src/pages/ProjectLive.tsx` | Live code runner (StackBlitz + Python) |
| `src/lib/projectStore.ts` | Project data store |
| `src/components/PythonRunner.tsx` | In-browser Python execution component |

### Technical Details

1. **Storage**: Hybrid — 3 hardcoded seed projects + admin-added projects in `localStorage` (`techshastra_projects`).
2. **StackBlitz embed**: `@stackblitz/sdk`'s `embedGithubProject()` loads the repo directly in an iframe.
3. **Python Runner** (`PythonRunner.tsx`): Fetches Python files from the GitHub repo and uses Pyodide (WebAssembly Python) to execute them in-browser.
4. **GitHub metadata fetch**: In Admin, pasting a GitHub URL triggers `fetchRepoMetadata()` which calls the GitHub API to auto-fill title, description, tags, and language.
