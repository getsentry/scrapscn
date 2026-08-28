# Scrapscn repository guide

Scrapscn is a standalone React and Tailwind clone of Sentry's regular Scraps
component library. The full-screen playground is the primary place to build and
review prototypes. Registry packages are a delivery format, not the local
prototyping environment.

## Help a designer get started

Use the shortest workflow that matches their Git experience.

1. Clone `getsentry/scrapscn` with GitHub Desktop or the GitHub CLI.
2. Open the cloned folder in a terminal.
3. Run `pnpm install`, then `pnpm dev`.
4. Open the URL printed by Next.js.
5. Select a component or template from the setup island. Configure its state,
   theme, and preview width.
6. Copy the current URL to share the same playground state.

The playground must work without a Sentry checkout, account, database, or
environment file. When setup fails, explain the next concrete action in plain
language. Do not assume that the designer knows Git commands.

## Prototype workflow

- Create a template with `pnpm template:create <slug> "<Title>"`.
- Edit the generated `src/templates/<slug>/template.tsx` file.
- Keep reviewable state in URL parameters so a shared link restores it.
- Run `pnpm build:next` before sharing substantial work.
- Push a branch and use its Vercel Preview URL for review. Use a branch preview
  for iteration and a commit preview for a fixed review version.

For GitHub Desktop, create a branch with **Current Branch → New Branch**, write a
clear commit summary, select **Commit**, then select **Publish branch**. The work
is ready to share when the preview opens directly, survives a hard refresh, and
restores the copied URL state.

## Component work

- Treat `scraps-parity.json` as the source of truth for canonical source files,
  public exports, local files, workbenches, tests, and completion state.
- Preserve portable Scraps consumer behavior. A consumer should normally move
  between the monolith and Scrapscn by changing only the import path.
- Implement component styling with Tailwind classes and static CSS. Keep
  CSS-in-JS runtimes and monolith-only dependencies out of the clone.
- Add or update the component workbench so designers can exercise important
  states without editing source code.
- Run the focused component tests while iterating. Run `pnpm verify` once after
  the final code edit of a complete change.

## Canonical comparison

Use the Sentry development UI only when a task needs direct monolith comparison
or new canonical visual evidence. Follow `docs/visual-baselines.md`. Keep the
comparison checkout at the commit recorded in `scraps-parity.json` so the result
can be reproduced.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
