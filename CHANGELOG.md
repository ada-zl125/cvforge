# Changelog

## [1.2.0] 2026-07-01

1. Add Agent Mode for resumes, academic CVs, and cover letters.
2. Add chat based document editing, change review, undo, live preview highlighting, and focused clarification flows for agent updates.
3. Add project instructions and uploaded PDF, MD, or TXT reference context for Agent Mode.
4. Add lightweight context retrieval so uploaded files are chunked and searched before relevant excerpts are sent to the agent.
5. Improve PDF context reading with PDF.js assets, page labels, browser compatible text streaming, and clearer upload error handling.
6. Improve Chinese document handling with language aware examples, institution names, locations, punctuation, and mixed Chinese and English spacing.
7. Improve UI language switching and Chinese UI coverage across landing and editor pages.
8. Refine landing page actions, editor layout behavior, and agent input resizing.
9. Improve preview pagination, PDF export reliability, textarea layout, responsive preview scaling, and review highlight rendering.
10. Fix dependency compatibility issues and include required PDF.js CMap, standard font, and license assets for static export.
11. Update document and agent chat session behavior for cleaner browser sessions while keeping LLM configuration saved.
12. Refactor editor and agent structure for clearer shared hooks, session state, UI components, and text normalization.
13. Update README and project Wiki documentation for the v1.2.0 feature set.

## [1.1.1] — 2026-05-03

- Fix UI display issues
- Add responsive layout support for different screen sizes
- Add collapsible editing panels and resizable layout controls in editor pages

## [1.0.1] — 2026-04-26

- Remove Address Line fields from resume editor Personal Information (academic CV only)
- Sync app icon with updated CVForge logo

## [1.0.0] — 2026-04-26

Initial release of CVForge.

- Resume, Academic CV, and Cover Letter editors with live A4 preview
- Export to PDF, PNG, and JSON; import from JSON
- Bilingual UI (English and Chinese)
- No account required — fully client-side, data stays in your browser
