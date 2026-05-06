@AGENTS.md

# CVForge — Project Context for Claude Code

## Product

A stateless online document builder for job seekers and academics. No accounts, no database — visitors use it as a tool and export when done.
- **Entry page**: visitor creates a new resume, academic CV, or cover letter, then jumps to the matching editor
- **Editor pages**: full editing with live A4 preview and export (PDF/PNG/JSON)

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

## Project Structure

```
app/
  page.tsx                  # Entry page (create CV action + config dialog)
  editor/page.tsx           # Resume editor (form + A4 preview)
  academic-cv/page.tsx      # Academic CV editor
  cover-letter/page.tsx     # Cover letter editor
  privacy/page.tsx          # Privacy policy
  terms/page.tsx            # Terms of service
components/
  editor/                   # Resume form, preview, toolbar, template
  academic-cv/              # Academic CV form, preview, toolbar, template
  cover-letter/             # Cover letter form, preview, toolbar, template
  shared/                   # Shared editor/preview helpers
  ui/                       # shadcn/ui generated components
lib/
  types/                    # Document TypeScript types
  export.ts                 # Browser-side PDF/PNG/JSON export helpers
  agent/                    # AI-powered document editing agent
    chat.ts                 # OpenAI streaming agent loop + system prompts
    tools.ts                # LangChain DynamicStructuredTool definitions (per doc type)
    executor.ts             # Pure functions: apply tool args → new content state
    config.ts               # LLM config read/write via localStorage
```

## GitHub Workflow

- Branch naming: `feature/issue-{N}-short-description`
- PR description must include `Closes #{N}` to auto-close the linked issue
- GitHub Project: https://github.com/users/ada-zl125/projects/

## Coding Style

Simplicity is the foundation of reliability. Keep implementations concise, clear, and efficient, while ensuring the system is well-engineered and robust.
