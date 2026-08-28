# Plan

## Approach

Treat the current repository as the implementation checkpoint, not as a fresh migration. Build the missing reusable proof around it, refresh the latest monolith comparison once, and process only the reported differences. Keep canonical captures frozen during the component loop. Run focused checks for each changed component and one full verification after the last change.

## 1. Replace the fixed 48 count with a discovered inventory

Update `scripts/generate-parity-manifest.mjs`, `scripts/validate-parity-manifest.mjs`, `scripts/parity-contract-inputs.mjs`, and `tests/parity/parity-manifest.test.mjs` so the canonical checkout determines the component-family inventory.

- Discover every top-level `static/app/components/core/*/index.tsx` entry point and the direct Form entry point.
- Classify top-level standalone files as public component API, shared dependency, test support, or explicit exclusion.
- Continue excluding the documentation-only `overview`, `patterns`, and `principles` directories.
- Derive public runtime and type exports from the canonical entry points.
- Report additions and removals instead of failing only on a hard-coded count.
- Record the exact comparison commit in `scraps-parity.json` as evidence.
- Keep the four approved CSS-in-JS-only contract-input exceptions. Fail on any new exception.

Verification:

```bash
pnpm parity:generate
pnpm parity:validate
node --test tests/parity/parity-manifest.test.mjs tests/scripts/parity-contract-inputs.test.mjs
git diff --exit-code -- scraps-parity.json
```

## 2. Use current green work and create a delta queue

Refresh the manifest against the latest monolith `main` once. Compare canonical source hashes, public exports, local exports, behavior fixtures, registry items, workbenches, stories, and Figma evidence.

Write a generated report with these states:

- unchanged and already green
- canonical source changed but public contract did not change
- public contract changed
- missing local implementation or evidence
- explicit exclusion

Do not edit or retest an unchanged component during the component loop. The existing 48 complete records, 175 runtime exports, 59 type exports, 48 registry items, 48 workbenches, 192 Scrapscn snapshots, and 11 Code Connect mappings remain valid until a detected delta invalidates them.

Verification:

```bash
pnpm parity:validate
```

The command must print the discovered family and export totals and a bounded delta queue.

## 3. Prove the registry convention once

Add a deterministic registry build and reference-install check in `package.json`, `registry.json`, `scripts/`, and `tests/scripts/`.

- Build `public/r` from `registry.json` with the pinned shadcn CLI.
- Start a controlled local registry endpoint only for the duration of the test.
- Create a clean temporary Tailwind project.
- Install `sentry-base` and `checkbox` with the shadcn CLI.
- Import and render Checkbox, then run its type check and production build.
- For every other registry item, validate the same JSON schema, source-file closure, registry-dependency closure, package dependencies, aliases, and generated artifact drift.
- Do not create and build 48 temporary projects.

Verification:

```bash
pnpm registry:build
pnpm test:registry
git diff --exit-code -- public/r
```

## 4. Finish the reusable Figma proof on Checkbox

Keep parserless Code Connect as the translation format. Do not build a general Emotion-to-Tailwind converter.

- Keep `figma.config.json` on the `Scrapscn React` label.
- Use `src/components/ui/checkbox.figma.ts` as the reference mapping.
- Verify the canonical node, size, checked, and state vocabulary.
- Run the existing exact property-combination validator in `scripts/figma-preview.mjs` and `tests/figma/figma-preview.test.mjs`.
- Compile the generated Scrapscn JSX.
- When a Figma access token is available, run one authenticated Code Connect preview and save sanitized pass evidence. Do not publish mappings.
- Require every other component with canonical Figma evidence to use the same parserless file shape, local import rule, property-vocabulary check, and label. Components without canonical Figma evidence remain documented as such.

Verification:

```bash
pnpm figma:parse
pnpm figma:preview
```

`pnpm figma:preview` is the one credentialed reference check. It must not print or store the token.

## 5. Capture canonical and local visuals with one system

Extend `tests/visual/`, `scripts/generate-visual-review.mjs`, and `docs/visual-baselines.md` so one scenario definition drives both sides of each comparison.

- Use the canonical Sentry catalog only at `https://sentry.dev.getsentry.net:8000/scraps`. Do not start Sentry through Portless or on another port.
- Require the Sentry checkout serving port 8000 to match the commit recorded by the inventory before capture.
- Capture the canonical monolith scenarios once. Store the commit, route, theme, viewport, state parameters, locale, font readiness, and reduced-motion setting beside each image.
- Capture the matching Scrapscn scenario through the local playground.
- Produce side-by-side, overlay, and image-difference views from the paired images.
- Capture one matched representative scenario per component family in light, dark, narrow, and wide views. Record every additional canonical catalog target and a scoped reason when the current local playground cannot isolate it. Keep the 192-image local regression suite as the all-module theme and viewport check.
- Keep canonical images frozen while fixing Tailwind components. Recapture only the changed local scenario.

Verification:

```bash
pnpm visual:canonical:capture
pnpm test:visual
pnpm visual:review
pnpm visual:validate
```

The visual report must reject a stale Sentry checkout, missing scenario, mismatched scenario metadata, or unreviewed image pair.

## 6. Triage the visual queue and fix only blocking differences

Store each review result in a checked-in visual-review ledger.

Allowed states:

- approved
- fixed
- accepted cosmetic deviation
- no canonical story, with reason

Fix differences that change the contract, behavior, accessibility, content, component state, responsive behavior, or major layout. Record small spacing, font rasterization, antialiasing, and other cosmetic differences with the reason and reviewer, then continue.

For each component that needs code changes:

1. Compare its latest canonical contract and source delta.
2. Change only the local implementation, focused tests, workbench scenario, or mapping needed for that delta.
3. Run its unit, type-contract, parity, and visual checks.
4. Update its manifest and visual-review evidence.
5. Move to the next reported component.

Do not run the full suite inside this loop.

## 7. Confirm the playground, templates, and Preview sharing once

Keep `/` as the full-screen playground with its setup island. Verify that discovered component families have workbenches and URL-restorable theme, viewport, component state, and template state.

- Run the existing 55-workflow playground suite once after the component loop.
- Verify template discovery and direct hard refresh.
- Open one Vercel Preview template URL in a second browser context and confirm that its shared state restores. This is one deployment proof, not a per-component test.
- Do not use registry installation as the playground validation environment.

Verification:

```bash
pnpm test:playground
pnpm test:templates
```

Record the one Vercel Preview URL and restoration result without adding deployment credentials to the repository.

## 8. Run one final verification and close the ledger

After the last source edit, run the complete verification once. Add a single `pnpm verify` command if one does not exist so later updates use the same gate.

The final gate includes:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm format:check
pnpm lint:oxlint
pnpm build:next
pnpm build-storybook
pnpm test:playground
pnpm test:templates
pnpm registry:build
pnpm test:registry
pnpm figma:parse
pnpm test:visual
```

Do not rerun the full gate without a source change. Completion requires no unexplained inventory entry, no unapproved contract exception, no blocking visual difference, no unreviewed canonical pair, and a green final gate.

## Risks and boundaries

- The server on port 8000 can be stale even when another checkout is current. Canonical capture must verify the serving checkout before it trusts the page.
- Some core files are shared hooks or contexts rather than component families. The generated inventory must classify them instead of silently adding or dropping them.
- Code Connect maps Figma properties to component JSX. It does not convert arbitrary Emotion source to Tailwind or reconstruct Emotion source from Tailwind classes.
- The authenticated Checkbox preview needs a Figma access token. Remote Code Connect publication remains out of scope.
- Browser and font rendering can produce harmless pixel noise. The review ledger allows documented cosmetic differences but never hides them by increasing a global screenshot tolerance.
