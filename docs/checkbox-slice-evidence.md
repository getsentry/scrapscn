# Checkbox vertical slice evidence

Date: 2026-08-21

Status: local automated gates pass; external Figma and reviewer gates remain open.

## Canonical source

- Sentry commit: `d91f823d232ddd12a4d2a64554d85fd36df0e278`
- Component: `static/app/components/core/checkbox/checkbox.tsx`
- Behavior tests: `static/app/components/core/checkbox/checkbox.spec.tsx`
- Visual cases: `static/app/components/core/checkbox/checkbox.snapshots.tsx`
- Code Connect migration input: `static/app/components/core/checkbox/checkbox.figma.tsx`
- Figma component: `https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3481-4211`

## Local proof

- `pnpm test`: 17 story files and 84 tests pass.
- `pnpm lint`: passes.
- `pnpm build:next`: passes with Next.js 16.3.2.
- `pnpm build-storybook`: passes.
- `pnpm test:playground`: 1 production-browser workflow passes. It changes Checkbox controls, reorders the stack, uses the keyboard, opens the template, submits the form, changes theme and viewport, copies the Share URL, and restores it in a second browser context.
- `pnpm test:templates`: 4 scaffold and metadata tests and 1 production-browser route test pass. The generated manifest is valid, the build prerenders `/templates/checkbox-settings`, and a hard refresh restores item order, disabled state, size, label, theme, viewport, and selected values.
- `pnpm figma:parse`: passes with label `Scrapscn React`.
- Package registry check: Next.js 16.3.2, React 19.2.8, and React DOM 19.2.8 are the current latest versions on 2026-08-21.

The Checkbox browser assertions cover exact sizes, radii, light and dark border colors, canonical SVG paths, size-specific stroke widths, focus-ring geometry, disabled and read-only behavior, `aria-disabled`, and inherited interaction color. These source-level and computed-style checks do not replace an approved side-by-side image baseline.

## Preview proof

- Deployment ID: `dpl_3sgJe18GmZrPfFb7tZedvcHRoDP9`
- Deployment URL: `https://scrapscn-62w85gow4.sentry.dev`
- Inspector: `https://vercel.com/sentry/scrapscn/3sgJe18GmZrPfFb7tZedvcHRoDP9`
- Vercel build: passes with Next.js 16.3.2 and prerenders the template route.
- Protected route check: an authenticated `vercel curl` request to `/templates/checkbox-settings` returns HTTP 200.

This CLI deployment proves the build and immutable deployment URL. It is not a Git branch URL or commit URL. Vercel Authentication protects it. An intended reviewer must still open it, create or use a Shareable Link, and confirm toolbar comments.

## Open manual gates

1. Record the approved Sentry page-frame Figma node URL. The local shell is not pixel-approved without it.
2. Provide `FIGMA_ACCESS_TOKEN` with Code Connect write and file-content read access. `pnpm figma:preview` must return all 18 successful Checkbox combinations.
3. Publish or inspect the `Scrapscn React` connection in Dev Mode for every Checkbox combination.
4. Run the Figma MCP design-to-code, code-to-canvas, and changed-property return-trip checks. Record the test-frame URL.
5. Approve a side-by-side Checkbox image baseline against the monolith or approved Figma component.
6. Push a branch or pull request to get Vercel branch and commit URLs. Confirm reviewer access and comments.
7. Measure cold `pnpm dev` startup, template hot reload, and the five-minute and ten-minute usability criteria with a new user.

The slice and the 48-module goal remain incomplete until these gates pass.
