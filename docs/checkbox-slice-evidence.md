# Checkbox vertical slice evidence

Date: 2026-08-21

Status: credential-free local checks, local Code Connect parsing, local Figma code-to-canvas, the recorded Vercel build, and cold development startup pass. Side-by-side visual approval, reviewer access, and new-user usability checks remain open. Remote Code Connect publication, Dev Mode verification, and Figma round-trip testing are release work outside the active parity goal.

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
- `pnpm build:next`: passes with Next.js 16.3.3.
- `pnpm build-storybook`: passes.
- `pnpm test:playground`: 2 production-browser workflows pass. They change Checkbox controls, reorder the stack, use the keyboard, open the template, submit the form, change theme and viewport, copy and restore the Share URL, and verify the physical mobile header and navigation workflow at 390 × 844 px.
- `pnpm test:templates`: 4 scaffold and metadata tests and 1 production-browser route test pass. The generated manifest is valid, the build prerenders `/templates/checkbox-settings`, and a hard refresh restores item order, disabled state, size, label, theme, viewport, and selected values.
- `pnpm figma:parse`: passes with label `Scrapscn React`.
- The Code Connect template uses the exact published Figma values for `size`, `checked`, and `state`. It maps the `Hover`, `Active`, and `Focused` design states to runtime interaction behavior instead of public props.
- Package registry check: Next.js 16.3.3, React 19.2.8, and React DOM 19.2.8 are the current latest versions on 2026-08-27.
- Local browser QA at 1440 × 1000 px and 390 × 844 px found no horizontal overflow, console errors, or broken state restoration after the responsive header fix. The mobile navigation opens, closes with Escape, and returns focus to its trigger.
- A cold Portless development run on 2026-08-27 moved `.next/dev` aside before launch. Next.js became ready in 368 ms. The first playground request compiled and returned in 3.9 seconds. Browser automation then found the setup control and three Checkbox inputs in the accessibility tree with no page errors. The warm process measured 53.7 ms TTFB, 96 ms LCP and FCP, 0 CLS, 36.9 ms React hydration, and a 378 ms Fast Refresh.

The Checkbox browser assertions cover exact sizes, radii, light and dark border colors, canonical SVG paths, size-specific stroke widths, focus-ring geometry, disabled and read-only behavior, `aria-disabled`, and inherited interaction color. These source-level and computed-style checks do not replace an approved side-by-side image baseline.

## Preview proof

- Git branch: `codex/checkbox-playground-slice`
- Git commit: `5b75cb8d059641c687b9bcc5e449323f340c0a63`
- Vercel branch URL: `https://scrapscn-git-codex-checkbox-playground-slice.sentry.dev`
- Immutable deployment URL for that commit: `https://scrapscn-3j7c2urk2.sentry.dev`
- Deployment ID: `dpl_9UbEtffSCkeo8yEsU2uxtTM8uwWR`
- Vercel build: passes with Next.js 16.3.2 and prerenders the template route.
- Protected route check: authenticated requests to the branch and immutable deployment template URLs return HTTP 200 with the complete review-state query.

Vercel Authentication protects these URLs. An intended reviewer must still open the branch URL, create or use a Shareable Link when needed, and confirm toolbar comments.

## Figma smoke-test proof

- Test file: `https://www.figma.com/design/fbuI9XgwsUA8xEum8WBGw8`
- Editable code-to-canvas capture: `https://www.figma.com/design/fbuI9XgwsUA8xEum8WBGw8?node-id=3-2`
- Semantic settings frame: `https://www.figma.com/design/fbuI9XgwsUA8xEum8WBGw8?node-id=5-171`
- Connected checked Checkbox instance: `https://www.figma.com/design/fbuI9XgwsUA8xEum8WBGw8?node-id=5-178`
- Code-to-canvas captured the direct local template as a 2000 × 1209 editable frame on 2026-08-21. This proves the local capture path, not the separate Vercel Preview capture gate.
- The semantic frame uses three published Sentry Checkbox instances: checked, indeterminate, and disabled unchecked. Their component properties use the canonical `size`, `checked`, and `state` vocabularies.
- Figma MCP design context recognizes the checked instance through the existing monolith connection and returns `<Checkbox size="sm" />` from `@sentry/scraps/checkbox`.

That last result records the release-work boundary. The local `Scrapscn React` connection has not been published, so Dev Mode cannot return `@/components/ui/checkbox`. Remote publication and Dev Mode round-trip testing do not block the active parity goal.

## Open manual gates

1. Approve a side-by-side Checkbox image baseline against the monolith.
2. Confirm reviewer access and comments on the recorded Vercel branch and immutable deployment URLs.
3. Run the five-minute and ten-minute usability criteria with a new user. Cold startup and hot reload are recorded above.

The slice remains incomplete until these gates pass. The 48-module goal also requires an owner decision on Select's open-ended `StylesConfig` contract.
