<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context

## Product

CVForge is a stateless browser based document builder for resumes, academic CVs, and cover letters. It has no user accounts and no database. Users create a document from the landing page, edit it in the matching editor, and export it when finished.

Document editing state is stored in `sessionStorage`, so a page refresh keeps the current work, while closing the tab starts a clean session next time. LLM configuration is the only long lived user setting stored in `localStorage`.

## Tech Stack

| Layer | Current Choice |
| --- | --- |
| Framework | Next.js 16.2 App Router with Turbopack |
| Runtime UI | React 19.2 client components |
| Language | TypeScript |
| Styling | Tailwind CSS v4 with global CSS tokens |
| UI primitives | shadcn/ui style components, Base UI, lucide-react icons |
| Animation | GSAP, React Bits inspired local components, and CSS transitions |
| Agent runtime | OpenAI SDK with LangChain DynamicStructuredTool wrappers |
| Agent validation | Zod schemas for tool arguments |
| Markdown rendering | react-markdown with remark-gfm |
| Export | html-to-image and jsPDF for browser side PNG and PDF export |
| Deployment | Static export via `next.config.ts` with optional `NEXT_PUBLIC_BASE_PATH` |

## Current Project Structure

```
app/
  page.tsx                  # Landing page and document creation dialogs
  editor/page.tsx           # Resume editor route
  academic-cv/page.tsx      # Academic CV editor route
  cover-letter/page.tsx     # Cover letter editor route
  privacy/page.tsx          # Privacy policy
  terms/page.tsx            # Terms of service
components/
  editor/                   # Resume editor UI, sections, toolbar, template
  academic-cv/              # Academic CV editor UI, sections, toolbar, template
  cover-letter/             # Cover letter editor UI, sections, toolbar, template
  shared/                   # Shared editor frame, preview helpers, agent panel, editor hooks
  shared/agent-panel/       # Pure agent panel UI components
  ui/                       # Shared UI primitives
examples/
  *.json                    # English and Chinese examples used by editors and agent prompts
lib/
  agent/                    # Agent loop, tools, executor, session state, text normalization
  types/                    # Document data types
  editor-state.ts           # Session backed editor state hook
  storage.ts                # Session storage helpers
  ui-language.tsx           # UI language store with hydration safe snapshots
  export.ts                 # Browser side export helpers
```

## Current State Model

- Editor document state uses `sessionStorage`.
- Agent chat state uses `sessionStorage`.
- LLM configuration uses `localStorage`.
- UI language preference uses `localStorage` through `useSyncExternalStore` to avoid hydration mismatch.
- Resume and academic CV support English and Chinese document modes.
- Cover letters currently support English document mode only.

## Agent Mode Notes

- Agent orchestration lives in `lib/agent/chat.ts`.
- Tool definitions live in `lib/agent/tools.ts`.
- Pure document updates live in `lib/agent/executor.ts`.
- Agent session state lives in `lib/agent/session-state.ts`.
- Agent text and document language normalization lives in `lib/agent/text-normalization.ts`.
- Keep agent UI components separate from agent state and tool execution logic.


# GitHub Requirements

## Branch Naming

Use lowercase kebab-case with a clear prefix:

- feature/basic-agent-mode
- refactor/edit-page-ui
- fix/ci-error

Recommended prefixes:

- feature/ — new features
- fix/ — bug fixes
- refactor/ — code or structure refactoring
- chore/ — maintenance tasks
- docs/ — documentation updates
- test/ — test-related changes

## Issue Titles

Keep issue titles concise and action-oriented:

- Add initial agent mode support
- Refactor edit page layout
- Fix CI pipeline error

Guidelines:

- Use imperative mood (Add, Fix, Refactor)
- Focus on one clear objective
- Avoid unnecessary details

## Commit, Issue, PR Description

Descriptions should be:

- Clear and concise English
- Focused only on relevant changes
- Preferably one sentence
- No more than three sentences

Examples:

- `git commit -m "Add #xxx: initial support for agent mode."`
- Refactor edit page layout and simplify component structure.
- Fix CI failure caused by missing environment variables.

Avoid:

- Long background explanations
- Irrelevant context
- AI-generated verbose wording

# Coding Style

Keep the code clean and easy to understand, with concise and clear comments written in English. Avoid using dashes in comments.
