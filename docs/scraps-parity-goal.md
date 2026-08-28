# Scraps parity and designer prototyping goal

Status: active

Baseline date: 2026-08-21

## Goal

Make Scrapcn the fastest supported place to prototype Sentry product interfaces outside the monolith.

A designer or engineer can clone Scrapcn, start the local app, open a Sentry page frame, and compose a realistic page with regular Scraps components. Local Code Connect templates preserve the canonical Figma node and property vocabulary for mapped components.

## Scope

The canonical regular Scraps library is `static/app/components/core` in the Sentry monolith, pinned to commit `a2db8365e2ec17c96b200bface596081c68f12c9`. It contains 48 component modules after the documentation-only `overview`, `patterns`, and `principles` directories are excluded.

Marketing components and Scrapcy variants do not count toward this goal. Extra shadcn components can remain, but they do not count toward regular Scraps parity.

The goal includes:

- Public component and prop compatibility with regular Scraps.
- Tailwind implementations that match the approved Figma components.
- An installable shadcn registry item for every completed module.
- A reusable Sentry page frame and a local composition playground at `/`.
- A file-based template workflow with direct URLs and Vercel Preview sharing.
- Storybook documentation, behavior tests, visual tests, and accessibility checks.
- Locally parsed Figma Code Connect mappings under a distinct Scrapscn label.

The goal does not require:

- Marketing-site components.
- Monolith business logic, routing, data fetching, permissions, or feature flags.
- Remote Code Connect publication, live Dev Mode verification, Figma MCP tests, code-to-canvas, or round-trip testing.

## Baseline

At the original baseline, Scrapcn had:

- 28 local UI implementation files.
- 17 of the 48 regular Scraps modules represented in some form.
- 31 regular modules with no corresponding implementation.
- 10 installable UI items in `registry.json`.
- 15 Storybook story files and 76 passing tests.
- No reusable page frame, composition playground, or Chat component.
- A marketing landing page at `/` that does not serve the local prototyping workflow and does not match the intended product frame.
- A passing Next production build.
- Next.js `16.3.2`, the stable `latest` release when this baseline was first recorded; React and React DOM are `19.2.8`.
- A failing lint command because generated Storybook output is included, plus two source errors and one source warning.
- Ten existing legacy Code Connect mappings in the monolith: Alert, FeatureBadge, Tag, Button, Checkbox, Radio, Slider, Switch, TextArea, and Tooltip. They point to published components in the Sentry “🐦 Components” Figma library and provide initial node URLs and property mappings, but they import the CSS-in-JS implementations and use the legacy React parser format.
- No generated `public/r/*.json` registry artifacts and no registry build command.
- A hosted registry URL that redirects unauthenticated requests to Vercel SSO. The shadcn CLI cannot use this as a public registry transport.

The current local checkpoint uses Next.js 16.3.3 and has a full-screen playground, reusable page frame, 48 component workbenches, file-based templates, generated registry items, and a machine-readable parity inventory. The manifest records all 48 modules as complete. Select applies every nested `StylesConfig` pattern used by the pinned monolith through fixed Tailwind selectors, CSS custom properties, and an aria-hidden decorative element. The public type still accepts arbitrary new selectors for source compatibility, and replacement components receive those objects through `getStyles`. Applying an unknown selector to the default DOM is an explicit portable-contract input exclusion because it would require runtime stylesheet injection or CSS-in-JS.

The repository has 11 local parserless Code Connect templates under the `Scrapscn React` label. Automated contract, behavior, accessibility, build, playground, template, registry, and Code Connect checks pass. Approved light, dark, narrow, and wide visual baselines are still missing as goal-level evidence. The manifest count does not override that acceptance gate.

## Definitions

### Complete component

A component module is complete only when all of these statements are true:

1. Every supported public runtime export from the canonical module exists.
2. Public prop names, values, defaults, controlled behavior, and event meaning are compatible.
3. A representative monolith usage compiles after only its import path changes.
4. Every documented visual variant and interaction state has a Storybook example.
5. Ported behavior tests, visual tests, and accessibility checks pass.
6. The module works in the local playground without a monolith dependency or private compatibility shim.
7. Its approved Figma components have Code Connect templates, or the parity manifest records why the module has no Figma component.

Internal implementation details can differ. Tailwind and Base UI can replace Emotion and React Aria when the public contract, behavior, accessibility, and appearance remain compatible.

### Portable contract inputs

A portable contract input works in the Tailwind-only Scrapcn architecture without a CSS-in-JS runtime, a legacy CSS parser, or runtime stylesheet injection. Import-path-only compatibility remains the goal for all portable inputs.

The owner-authorized exceptions are `tooltip.overlayStyle.serializedStyles`, `modal.modalCss.interpolation`, `layout.renderFunction.arbitraryCssProperties`, and `select.stylesConfig.arbitraryNestedSelectors`. Canonical `TooltipProps.overlayStyle` also accepts Emotion `SerializedStyles`; Scrapcn accepts `React.CSSProperties` only. Alert, Avatar, AvatarButton, Badge, BreadcrumbList, Button, CompactSelect, Form, MenuListItem, Modal, SegmentedControl, Select, Tabs, and Tooltip expose this boundary through direct props, compound components, nested elements, generic constraints, or hook and render-prop returns. Canonical `ModalOptions.modalCss` accepts Emotion `Interpolation<Theme>`; Scrapcn accepts a Tailwind class string only. Canonical `ContainerPropsWithRenderFunction` retains the `ContainerLayoutProps` members backed by indexed `React.CSSProperties` values. Scrapcn render-function children receive finite literal Tailwind classes only; use the ordinary `as` form or move a dynamic CSSProperties value into the target component static Tailwind or CSS. Canonical Select `StylesConfig` accepts new nested selector strings at runtime. Scrapcn applies flat declarations and every nested pattern found in the pinned monolith, and passes the complete callback result to replacement components. Move any new nested rule into literal Tailwind or static CSS. The generator derives all closures from pinned TypeScript declaration identities. The manifest records each exported path as diagnostic evidence. Moving the replay call site requires translating its dynamic padding and widths, `!important` declarations, and responsive rule into Tailwind or static CSS. Moving a modal interpolation requires the same translation. These cases are not import-path-only changes.

### Figma interoperability

Code Connect template files are the maintained local integration format. Mappings use parserless `.figma.ts` templates instead of the legacy framework parser format.

The ten monolith mappings are migration inputs, not files to copy unchanged. Scrapcn reuses each pinned Figma node URL and property vocabulary, replaces the source import and generated JSX with the compatible Scrapcn interface, and validates the result locally under the `Scrapscn React` label. EmptyState adds one property-free mapping from its pinned MDX node. An exact empty canonical property map, such as Slider's, produces a property-free local template instead of invented mappings.

Remote publication and Figma application workflows are release work outside this goal.

### Template

A template is a source-controlled page composition for design review. It has a unique slug, title, description, tags, co-located metadata, and one React implementation. The playground discovers templates without a second manual registration edit and serves each one at `/templates/<slug>`.

Template controls that affect review, including theme, viewport, and documented component state, are serializable in the URL. Opening or refreshing a shared URL restores the same review state. Templates use local mock data and need no database, authentication, environment variable, or monolith service.

## Required artifacts

The completed repository contains:

1. A machine-readable parity manifest for all 48 regular modules. Each entry records canonical source paths and commit, public exports, registry item, stories, tests, Figma nodes, and completion state.
2. Tailwind implementations for all in-scope public exports.
3. One registry item per regular module, plus dependency metadata.
4. A local playground at `/` that replaces the marketing landing page.
5. A reusable `PageFrame` with a sidebar, top bar, page header, breadcrumbs, action area, and composable content region.
6. A component catalog, theme and viewport controls, component controls, and realistic multi-component templates inside the playground.
7. A template scaffold command, automatic template discovery, direct template routes, URL-persisted review state, and a Share action.
8. Component stories and at least one page-frame composition story.
9. Code Connect `.figma.ts` templates and a current `figma.config.json`.
10. Automated playground, template, type, behavior, visual, accessibility, and build checks.
11. A short designer quick-start guide for local prototypes, template creation and sharing, and local Code Connect validation.

## End-state acceptance criteria

The goal passes only when every gate below passes. A checklist or file count alone is not sufficient evidence.

### Gate 1: inventory and scope

- The parity manifest contains exactly the 48 regular Scraps modules.
- Every module is `complete`, except for a documented owner-authorized portable contract-input exclusion in the parity manifest. Any new exclusion changes the target and must update this goal before completion.
- Marketing variants and extra shadcn components are labeled separately and do not increase the parity score.
- A test fails when a canonical public export is missing from the manifest or implementation.

### Gate 2: component contract parity

- Every non-excluded canonical runtime export is available from the corresponding Scrapcn module.
- Contract fixtures cover prop names, variant values, sizes, defaults, controlled and uncontrolled behavior, callback meaning, refs, and compound-component structure where applicable.
- At least one representative canonical usage per module compiles after only the import path changes, except when the recorded portable contract-input exclusion requires a Tailwind or static-CSS translation.
- A module with a public contract or behavior difference remains incomplete until the difference is removed or this goal explicitly records an owner-authorized portable contract-input exclusion.

### Gate 3: behavior and visual parity

- Canonical tests that describe portable component behavior are ported or replaced by equivalent tests.
- Every documented variant, size, disabled state, loading state, error state, focus state, and open state appears in Storybook when it applies.
- Approved light-mode and dark-mode visual baselines have no unreviewed changes.
- Responsive components have approved baselines at their supported narrow and wide widths.
- Animation tests respect reduced motion when the component uses motion.

### Gate 4: accessibility

- Storybook accessibility tests report no serious or critical violations.
- Interactive components have keyboard tests for entry, activation, navigation, dismissal, and focus return where those behaviors apply.
- Form components have accessible names, descriptions, errors, disabled states, and form submission behavior.
- Overlay components manage focus, escape, outside interaction, scroll locking, and focus restoration.

### Gate 5: local playground

- `/` opens the playground instead of a marketing page.
- The playground has component and template navigation, a canvas, theme controls, desktop and mobile viewport controls, and reset behavior.
- Selecting a component exposes its supported public controls and renders changes immediately.
- Templates render several components together in the same page frame so spacing, overflow, focus, and overlay behavior can be evaluated in context.
- The playground imports the same public component modules that later registry items publish. It has no playground-only component copies.
- An end-to-end browser test starts at `/`, opens a component, changes its controls, opens a page template, changes theme and viewport, copies its Share URL, and completes one keyboard interaction.
- After dependencies are installed, `pnpm dev` is the only command required to open the playground. No local environment configuration or external service is required.
- On the reference development machine, the interactive homepage is available within 15 seconds of starting `pnpm dev`, and a saved template edit appears within two seconds through hot reload.
- In a timed usability check, a new user can start the playground within five minutes of receiving the repository and can create or modify a template within ten minutes without help from a monolith engineer.

### Gate 6: templates and Vercel Previews

- One documented scaffold command creates a valid new template and its co-located metadata. The author edits one React implementation file to build the composition.
- A new valid template appears automatically in playground navigation and at `/templates/<slug>` without editing a central registry.
- Every template route supports direct navigation and hard refresh in local, Preview, and Production environments.
- The Share action copies the absolute current template URL, including supported review-state parameters.
- Opening the copied URL in a second browser restores the same template, theme, viewport, and documented component state.
- A Git branch or pull request produces a Vercel Preview Deployment. Its branch URL follows the latest branch commit, while its commit URL preserves the reviewed version.
- Intended internal reviewers can open the Preview URL through configured team access. External review uses a Vercel Shareable Link when deployment protection is enabled.
- The Preview requires no production data, secrets, database, or monolith service.
- The Vercel build discovers every template and fails on duplicate slugs, invalid metadata, broken imports, or a template route that cannot render.
- Reviewers can use the Vercel Preview URL and toolbar comments without running Scrapcn locally.

### Gate 7: page-frame prototyping

- A designer can reach a working page-frame template from the local playground without opening the Sentry monolith.
- The page frame supports desktop and narrow layouts, light and dark modes, breadcrumbs, title, actions, navigation, and arbitrary page content.
- The page frame contains no monolith data, routing, permissions, or feature-flag dependency.
- A composition story demonstrates at least a form page, a table or list page, an empty state, and an overlay interaction.
- The page-frame templates use the public local component modules and remain valid inputs for later registry packaging.

### Gate 8: local Figma Code Connect

- Every complete visual component with pinned Figma evidence has a locally parsed `.figma.ts` Code Connect template under the distinct `Scrapscn React` label.
- `figma connect parse --exit-on-unreadable-files` passes in CI.
- Templates use parserless `figma.code`, the pinned node URL, local imports, and only the property vocabulary supported by canonical evidence.
- Focused tests verify node URLs, imports, property mappings, and parserless format. Tokens and credentials are never committed.
- Remote publication, live library metadata, Dev Mode verification, Figma MCP smoke tests, code-to-canvas, and round-trip validation are release work outside this active parity goal.

### Gate 9: repository health and documentation

- Tests, lint, type checks, the production build, Storybook build, playground and template end-to-end checks, and Code Connect parsing pass from a clean checkout.
- `next` matches the stable `latest` release reported by the package registry when the goal starts and again before completion. React, React DOM, and their types satisfy the version recommended by that Next.js release. Oxlint and Oxfmt are the only source lint and format tools.
- The exact Next.js version is pinned in `package.json`, recorded in the evidence, and used by the Vercel Preview build.
- Generated Storybook output is excluded from source linting.
- The README states the canonical source, supported Next and shadcn versions, designer quick start, page-frame workflow, registry installation, and Figma workflow.
- The parity manifest identifies the exact Sentry source commit used for the comparison.

Registry generation and hosted installation remain release requirements for the finished library. They are not the validation environment for component parity or the first vertical slice. Complete local playground behavior before registry transport work begins.

## Original vertical slice

The first slice proved the delivery system before the full 48-module port. Its local work is complete. Remote Figma work was later removed from the active goal.

### Slice contents

1. **Checkbox parity:** Port the canonical `Checkbox` and `CheckboxProps` contract. Cover `xs`, `sm`, and `md`; default `sm`; unchecked, checked, and indeterminate values; controlled changes; disabled and read-only behavior; refs; native form submission; labels; focus; and keyboard behavior.
2. **Playground homepage:** Replace the marketing landing page at `/` with a full-viewport preview canvas. A floating, collapsible setup island provides component and template navigation, light and dark controls, desktop and mobile viewport controls, and reset behavior without wrapping the preview in separate playground chrome.
3. **Checkbox workbench:** Add a Checkbox entry with live controls for size, checked value, disabled state, and label. Add, remove, and reorder several Checkbox examples in a stack to prove the composition model without building a general visual editor.
4. **Minimal page frame:** Add a reusable local `PageFrame` with a sidebar, top bar, breadcrumbs, title, action slot, and content slot. It can use semantic HTML and local Tailwind layout until the full Scraps layout module is ported.
5. **Template workflow:** Add the template scaffold command and automatic discovery. Use it to create a `checkbox-settings` template that renders several labeled Checkboxes in a native form and shows the submitted form state.
6. **Shareable review state:** Serve the template at `/templates/checkbox-settings`. Persist its theme, viewport, and documented Checkbox state in the URL. Add a Share action that copies that exact state.
7. **Local browser proof:** Run the local app and test the real `/` workflow: open Checkbox, change its controls, reorder the stack, open the settings template, submit the form, change theme and viewport, copy the URL, and restore the same state in a second browser context using only the copied URL.
8. **Vercel Preview proof:** Push the slice branch, wait for its Vercel Preview, and repeat the share test with both the branch URL and the commit URL. Confirm that an intended reviewer can open and comment on the template without local setup.
9. **Figma component proof:** Create a Code Connect template for the existing canonical Checkbox Figma component at node `3481:4211` in the Sentry Components library. Map size, checked value, and disabled state to the compatible Checkbox API.

### Slice automated pass criteria

The slice passes its automated gate when future repository scripts prove all of the following:

```text
pnpm test
pnpm lint
pnpm build:next
pnpm build-storybook
pnpm test:playground
pnpm test:templates
pnpm figma:parse
```

The new scripts must be deterministic and documented. `test:playground` must exercise the local `/` workflow in a real browser. `test:templates` must validate metadata, unique slugs, discovery, direct routes, URL-state restoration, and production rendering. Agents run the development server through `portless` as required by `AGENTS.md`. `figma:parse` must run Code Connect parsing with unreadable files treated as failures.

The Checkbox visual test matrix covers three sizes by three checked values by enabled and disabled states in both light and dark modes. The playground and page-frame smoke tests cover agreed desktop and mobile widths.

### Why this is the minimum useful slice

Checkbox is the smallest component that still tests types, native forms, controlled state, indeterminate state, keyboard input, focus, accessibility, visual states, and an existing canonical Figma mapping. The playground proves the designer entry point. The page frame and settings template prove local composition. Direct URLs and Vercel Preview prove asynchronous sharing.

### Go or no-go experiment

Run the slice in this order:

1. Make Checkbox contract, behavior, accessibility, and visual tests pass inside Scrapcn.
2. Replace the marketing homepage with the local playground shell and Checkbox workbench.
3. Add the template scaffold, automatic discovery, reusable page frame, and `checkbox-settings` template.
4. Build and run Scrapcn locally, then exercise component controls, stack ordering, native form state, theme, viewport, URL-state restoration, and keyboard behavior in the browser.
5. Open the copied local Share URL in a second browser context and confirm the same review state.
6. Push the branch and repeat the share test on its Vercel branch and commit Preview URLs with another intended reviewer.
7. Parse the Checkbox Code Connect template under the distinct Scrapscn label.
8. Give the written quick start to a designer or engineer who did not build the slice. Confirm the five-minute startup and ten-minute template-creation criteria without verbal help.

Proceed to the 48-module goal only when all eight steps pass. A failure means the slice remains active until the shared pipeline is fixed. Do not work around a playground, template, Vercel Preview, page-frame, Code Connect, or documentation failure inside later component ports.

## Evidence format

Each completed slice or module records:

- Canonical Sentry commit and source paths.
- Scrapcn implementation and registry paths.
- Passing command output or CI links.
- Measured local startup and template hot-reload times.
- Storybook story and approved visual baseline.
- Template slug, local route, Vercel branch URL, and Vercel commit URL.
- Share-URL restoration result from a second browser context.
- Pinned Figma component URLs.
- Code Connect parse result.
- Approved exceptions, if any.

## Current goal handoff

Use this objective for the active implementation goal:

> Create a Tailwind clone of all 48 regular Scraps modules. Preserve the consumer API and Figma property vocabulary so a component usage can move between the monolith and Scrapscn by changing only its import path. Provide locally validated Code Connect mappings with a distinct Scrapscn label. Remote Figma publication and round-trip testing are out of scope.

## External references

- Code Connect overview: <https://developers.figma.com/docs/code-connect/>
- Code Connect template files: <https://developers.figma.com/docs/code-connect/template-files/>
- Code Connect CLI: <https://developers.figma.com/docs/code-connect/cli-reference/>
- Vercel Preview environments: <https://vercel.com/docs/deployments/environments>
- Vercel generated branch and commit URLs: <https://vercel.com/docs/deployments/generated-urls>
- Vercel Shareable Links: <https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links>
