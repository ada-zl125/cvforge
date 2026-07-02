<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context

## Product

CVForge is a stateless browser based document builder for resumes, academic CVs, and cover letters. It has no user accounts and no database. Users create a document from the landing page, edit it in the matching editor, and export it when finished.

Document editing state, Agent Mode chat state, uploaded reference context, project instructions, clarification state, and recent agent changes are stored in `sessionStorage`. A page refresh keeps the current tab state, while closing the tab starts a clean session next time.

LLM configuration and UI language preference are the only long lived user settings stored in `localStorage`.

Agent Mode helps users edit documents through structured tools. It supports clarification flow, undo, review highlights, project instructions, and local reference files. Uploaded reference files are searched locally and only relevant excerpts are sent into the agent context.

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
| Reference search | MiniSearch for browser side full text retrieval |
| PDF text extraction | PDF.js for selectable text PDF files |
| Markdown rendering | react-markdown with remark-gfm |
| Export | html-to-image and jsPDF for browser side PNG and PDF export |
| Testing | Vitest with jsdom for focused unit tests |
| CI | GitHub Actions for code quality, unit tests, and build checks |
| Deployment | Static export via `next.config.ts` with optional `NEXT_PUBLIC_BASE_PATH` |

## Current Project Structure

```
app/
  page.tsx                  Landing page and document creation dialogs
  editor/                   Resume editor route
  academic-cv/              Academic CV editor route
  cover-letter/             Cover letter editor route
  privacy/                  Privacy policy route
  terms/                    Terms of service route
components/
  editor/                   Resume editor UI
  academic-cv/              Academic CV editor UI
  cover-letter/             Cover letter editor UI
  shared/                   Shared editor frame, preview, agent panel, and hooks
  ui/                       Shared UI primitives
examples/
  *.json                    Example document content
lib/
  agent/                    Agent loop, tools, executor, context, review, and session logic
  types/                    Document data types
  document-normalizers.ts   Import, example, and export data normalisation
  editor-state.ts           Session backed editor state hook
  storage.ts                Session storage helpers
  ui-language.tsx           UI language store with hydration safe snapshots
  export.ts                 Browser side export helpers
.github/workflows/
  ci.yml                    Code quality, unit test, and build checks
  deploy.yml                GitHub Pages deployment
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


# Development Workflow

Before implementing a feature, follow this workflow:

1. Create an issue for the task. Keep the issue title and description concise, clear, and focused.
2. Create a branch for the issue, such as `feat/preprocessor` or `experiment/baseline-solution`. Do all related work on this branch.
3. Analyse the problem and implement the required code or file changes.
4. After completing the work for the issue, request approval before pushing changes or opening a pull request.
5. Open a pull request to the dev branch and wait for CI validation.
6. After the pull request is successfully merged into dev, mark the issue as completed and remind the user to delete the related branch.

Guidelines:

1. Issue and pull request descriptions should be concise, clear, and written in English. Avoid redundant details and dashes.
2. Commit messages should be one clear English sentence. Avoid dashes. For example, "git commit -m "feat: xxxxx (#\[issue-number\])""
3. Always request approval before creating a new branch, before each push, and before opening a pull request.
4. After opening a pull request, request review. Once the user approves and the pull request is merged, remind the user to remove the redundant branch.


# Coding Style

Code should be concise, clear, efficient, and easy to read. Maintain good structure and engineering practices. Do not overcomplicate the task, but do not oversimplify it either. 

Use comments where helpful, but keep them short, clear, and in English. Avoid using dashes in comments.


# Documentation Style

When writing project documentation, such as README.md, use concise, clear, professional, and accurate English. Avoid redundant or unnecessary wording. Do not use dashes or colons.
