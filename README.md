# Scrapscn

Scrapscn is a local playground for Sentry product interface prototypes. It ports regular Scraps components from the Sentry monolith to React and Tailwind. It also provides shadcn registry items as a release format.

The canonical source is `static/app/components/core` in `getsentry/sentry`. The current parity baseline is Sentry commit `d91f823d232ddd12a4d2a64554d85fd36df0e278`.

## Start a prototype

You need Node.js 24 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Next.js. The homepage is the playground. It needs no Sentry monolith, account, database, environment variable, or external service.

Use the left controls to change the Checkbox props, reorder the form rows, switch theme or preview width, and reset the page. Select **Checkbox settings** to open the direct template route. Select **Share** to copy an absolute URL that restores the current review state.

## Create a template

```bash
pnpm template:create issue-review "Issue review"
```

The command creates:

```text
src/templates/issue-review/
  template.json
  template.tsx
```

Edit `template.tsx`. Do not edit a central template registry. Scrapscn generates the template manifest before `pnpm dev` and `pnpm build:next`. The new template appears at `/templates/issue-review` and in playground navigation.

Each template uses local mock data. Put state that reviewers must share in URL parameters.

## Share with Vercel Preview

Push the prototype branch. Open both the Vercel branch URL and the commit URL. The branch URL follows new commits. The commit URL keeps the reviewed version fixed. If deployment protection is active, create a Vercel Shareable Link for an external reviewer.

Verify the direct template route, a hard refresh, the Share URL, and toolbar comments before review. Do not use production data or secrets in a template.

## Figma Dev Mode

The Checkbox Code Connect file is `src/components/ui/checkbox.figma.ts`. It connects Scrapscn to the canonical Checkbox node `3481:4211` in the Sentry Components Figma library. The connection label is `Scrapscn React`, so it does not replace the monolith connection.

Run the local syntax check without credentials:

```bash
pnpm figma:parse
```

To inspect all remote property combinations, provide a Figma access token in your shell and run:

```bash
FIGMA_ACCESS_TOKEN=... pnpm figma:preview
```

Never commit the token. Before publication, confirm in Dev Mode that size, checked state, and disabled state produce the expected `@/components/ui/checkbox` import and JSX.

For local code to canvas, run the template and use Figma MCP `generate_figma_design`. Its one-time URL includes a `figmacapture` hash that enables the development-only capture script for that visit. Test a Vercel Preview through the separate external-URL capture workflow. Production pages and runtime JavaScript do not load or contain the local capture bootstrap; source maps can retain development source text. The result must contain editable layers. For the return trip, change a connected Checkbox property and its label in the Figma test frame, read that frame through Figma MCP, and update the existing `Checkbox` usage. Do not replace it with raw markup.

The approved Sentry page-frame Figma node is not yet recorded. The local page frame is a source-grounded structural prototype. Do not call it pixel-approved until Design provides a node URL and accepts the comparison.

## Checks

```bash
pnpm test
pnpm lint
pnpm build:next
pnpm build-storybook
pnpm test:playground
pnpm test:templates
pnpm test:figma-capture
pnpm figma:parse
pnpm figma:preview
```

`test:playground` starts the production app through `portless`, completes the real browser workflow, and restores the copied URL in a second browser context. `test:templates` validates metadata, discovery, scaffold behavior, imports, and production routes.

The full end state and exact completion gates are in [docs/scraps-parity-goal.md](docs/scraps-parity-goal.md). The first Checkbox slice does not mean all 48 regular Scraps modules are complete.

## Registry release format

Registry installation is not the first parity test. After a module passes the local playground and Figma gates, it can be published as a shadcn item. Existing registry consumers can install the base theme with:

```bash
npx shadcn add https://scrapscn.sentry.dev/r/sentry-base
```
