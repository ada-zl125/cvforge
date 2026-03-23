@AGENTS.md

# EasyCV — Project Context for Claude Code

## Product

Online resume generation tool for job seekers and academics. Users fill in content; the app handles professional layout. V1.0 supports 3 pages: Landing/Auth, Workspace, Resume Editor.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack default) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` syntax) |
| Components | shadcn/ui (primary UI library) |
| Design | shadcn/ui-based, clean & modern, light mode only |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Deployment | Vercel |

## Key Next.js 16 Notes

- `params` and `searchParams` in page components are **fully async** — always `await params` before use
- Turbopack is used by default (`next dev` / `next build`)
- React 19.2

## Common Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
supabase db push     # Push local migrations to remote Supabase
supabase db diff     # Generate migration from schema changes
```

## Project Structure

```
app/
  page.tsx                  # Landing page + Auth
  workspace/page.tsx        # Workspace (resume list)
  editor/[id]/page.tsx      # Resume editor (form + A4 preview)
  auth/callback/route.ts    # Supabase OAuth callback
  api/export/
    pdf/route.ts
    docx/route.ts
components/
  auth/                     # AuthModal
  workspace/                # ResumeCard, CreateResumeModal, etc.
  editor/                   # FormPanel, PreviewPanel, templates/
  ui/                       # shadcn/ui generated components
lib/
  supabase/
    client.ts               # Browser client (createBrowserClient)
    server.ts               # Server client (createServerClient + cookies)
  types/resume.ts           # ResumeContent TypeScript types
supabase/migrations/        # SQL migrations (never edit manually)
middleware.ts               # Route protection
```

## Database

Table: `resumes` (id, user_id, title, template, content jsonb, created_at, updated_at)
RLS enabled — users can only access their own resumes.
Supabase project ref: `tzpgsfaxorayraazbosm` (Frankfurt region)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## GitHub Workflow

- Branch naming: `feature/issue-{N}-short-description`
- PR description must include `Closes #{N}` to auto-close the linked issue
- GitHub Project: https://github.com/users/ada-zl125/projects/2
