@AGENTS.md

# EasyCV — Project Context for Claude Code

## Product

A stateless online resume builder for job seekers and academics. No accounts, no database — visitors use it as a tool and export when done. Two pages only:
- **Entry page**: visitor creates a new CV (picks title, language, template), then jumps to the editor
- **Editor page**: full resume editing with live A4 preview and export (PDF/PNG)

Resume state is stored in `localStorage` for session persistence. No server-side data storage.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack default) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` syntax) |
| Components | shadcn/ui (primary UI library) |
| Design | shadcn/ui-based, clean & modern, light mode only |
| Deployment | Vercel (or GitHub Pages with static export) |

## Key Next.js 16 Notes

- `params` and `searchParams` in page components are **fully async** — always `await params` before use
- Turbopack is used by default (`next dev` / `next build`)
- React 19.2

## Common Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
```

## Project Structure

```
app/
  page.tsx                  # Entry page (create CV action + config dialog)
  editor/page.tsx           # Resume editor (form + A4 preview)
  api/export/
    pdf/route.ts            # PDF export (Puppeteer, server-side)
    png/route.ts            # PNG export (Puppeteer, server-side)
components/
  editor/                   # FormPanel, PreviewPanel, templates/
  ui/                       # shadcn/ui generated components
lib/
  types/resume.ts           # ResumeContent TypeScript types
```

## GitHub Workflow

- Branch naming: `feature/issue-{N}-short-description`
- PR description must include `Closes #{N}` to auto-close the linked issue
- GitHub Project: https://github.com/users/ada-zl125/projects/
