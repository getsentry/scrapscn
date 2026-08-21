# Scraps parity and designer prototyping goal

Status: proposed

Baseline date: 2026-08-21

## Goal

Make Scrapcn the fastest supported place to prototype Sentry product interfaces outside the monolith.

A designer or engineer can clone Scrapcn, start the local app, open a Sentry page frame, compose a realistic page with regular Scraps components, and move the result between code and Figma Dev Mode without replacing mapped components with approximations.

## Scope

The canonical regular Scraps library is `static/app/components/core` in the Sentry monolith, pinned to commit `d91f823d232ddd12a4d2a64554d85fd36df0e278`. It contains 48 component modules after the documentation-only `overview`, `patterns`, and `principles` directories are excluded.

Marketing components and Scrapcy variants do not count toward this goal. Extra shadcn components can remain, but they do not count toward regular Scraps parity.

The goal includes:

- Public component and prop compatibility with regular Scraps.
- Tailwind implementations that match the approved Figma components.
- An installable shadcn registry item for every completed module.
- A reusable Sentry page frame and a local composition playground at `/`.
- A file-based template workflow with direct URLs and Vercel Preview sharing.
- Storybook documentation, behavior tests, visual tests, and accessibility checks.
- Figma Dev Mode component mappings and tested workflows in both directions.

The goal does not require:

- Marketing-site components.
- Monolith business logic, routing, data fetching, permissions, or feature flags.
- A lossless conversion between browser DOM and Figma component instances. Code-to-canvas must produce editable design layers and visual fidelity. Code Connect provides component identity for Figma-to-code work.

## Baseline

Scrapcn currently has:

- 28 local UI implementation files.
- 17 of the 48 regular Scraps modules represented in some form.
- 31 regular modules with no corresponding implementation.
- 10 installable UI items in `registry.json`.
- 15 Storybook story files and 76 passing tests.
- No reusable page frame, composition playground, or Chat component.
- A marketing landing page at `/` that does not serve the local prototyping workflow and does not match the intended product frame.
- A passing Next production build.
- Next.js `16.3.2`, the stable `latest` release when this baseline was updated, with matching `eslint-config-next`; React and React DOM are `19.2.8`.
- A failing lint command because generated Storybook output is included, plus two source errors and one source warning.
- Ten existing legacy Code Connect mappings in the monolith: Alert, FeatureBadge, Tag, Button, Checkbox, Radio, Slider, Switch, TextArea, and Tooltip. They point to published components in the Sentry “🐦 Components” Figma library and provide initial node URLs and property mappings, but they import the CSS-in-JS implementations and use the legacy React parser format.
- No generated `public/r/*.json` registry artifacts and no registry build command.
- A hosted registry URL that redirects unauthenticated requests to Vercel SSO. The shadcn CLI cannot use this as a public registry transport.

An existing file or a similar name is not proof of parity. Current examples include Button, Alert, Slider, TextArea, Badge, Avatar, Input, Link, Select, Tabs, and Tooltip APIs that differ from their canonical Scraps APIs.

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

### Figma interoperability

Figma interoperability contains three distinct workflows:

- **Design to code:** Figma Dev Mode and the Figma MCP server return Scrapcn component names, imports, and mapped props for connected instances.
- **Code to canvas:** Figma's `generate_figma_design` workflow captures the running prototype as editable Figma design layers.
- **Design iteration back to code:** An agent reads an updated Figma frame and changes the prototype while preserving connected Scrapcn components.

Code Connect template files are the maintained integration format. New mappings use `.figma.ts` templates instead of the legacy framework parser format.

The ten monolith mappings are migration inputs, not files to copy unchanged. Scrapcn reuses each verified Figma node URL and property vocabulary, replaces the source import and generated JSX with the compatible Scrapcn interface, uses a distinct Scrapcn connection label, and validates the result before publication. A mapping remains incomplete when the old file has missing property coverage, such as the current Slider mapping with an empty `props` object.

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
11. A short designer quick-start guide for local prototypes, template creation and sharing, Figma-to-code, and code-to-canvas.

## End-state acceptance criteria

The goal passes only when every gate below passes. A checklist or file count alone is not sufficient evidence.

### Gate 1: inventory and scope

- The parity manifest contains exactly the 48 regular Scraps modules.
- Every module is `complete`. An owner-approved scope exclusion changes the target and must update this goal before completion.
- Marketing variants and extra shadcn components are labeled separately and do not increase the parity score.
- A test fails when a canonical public export is missing from the manifest or implementation.

### Gate 2: component contract parity

- Every non-excluded canonical runtime export is available from the corresponding Scrapcn module.
- Contract fixtures cover prop names, variant values, sizes, defaults, controlled and uncontrolled behavior, callback meaning, refs, and compound-component structure where applicable.
- At least one representative canonical usage per module compiles after only the import path changes.
- A module with a public contract or behavior difference remains incomplete until the difference is removed or this goal is explicitly revised.

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

### Gate 8: Figma Dev Mode and MCP

- Every complete visual component is connected to its approved published Figma component through a `.figma.ts` Code Connect template.
- `figma connect parse --exit-on-unreadable-files` passes in CI.
- Code Connect templates map every supported Figma property to the correct code prop or explicitly document why a property is design-only.
- Dev Mode shows the correct Scrapcn import and JSX for representative variants of every connected component.
- A Figma MCP design-to-code smoke test on a frame with connected instances uses Scrapcn imports and does not recreate those components with raw elements.
- Every semantic CSS token used by a complete visual component maps to a published Figma variable or is recorded as code-only with a reason.
- Figma variables used by the smoke frame have a tested mapping to Scrapcn semantic CSS tokens.
- A code-to-canvas smoke test captures the running page-frame prototype into a new or existing Figma file as editable layers.
- After a reviewer changes a mapped component property and copy in Figma, the design-to-code workflow updates the prototype with the correct Scrapcn prop and text while all automated checks remain green.
- Figma URLs and non-secret evidence from the last successful smoke test are recorded in a repeatable test report. Tokens and credentials are never committed.

### Gate 9: repository health and documentation

- Tests, lint, type checks, the production build, Storybook build, playground and template end-to-end checks, and Code Connect parsing pass from a clean checkout.
- `next` and `eslint-config-next` match the stable `latest` release reported by the package registry when the goal starts and again before completion. React, React DOM, and their types satisfy the version recommended by that Next.js release.
- The exact Next.js version is pinned in `package.json`, recorded in the evidence, and used by the Vercel Preview build.
- Generated Storybook output is excluded from source linting.
- The README states the canonical source, supported Next and shadcn versions, designer quick start, page-frame workflow, registry installation, and Figma workflow.
- The parity manifest identifies the exact Sentry source commit used for the comparison.

Registry generation and hosted installation remain release requirements for the finished library. They are not the validation environment for component parity or the first vertical slice. Complete local playground behavior before registry transport work begins.

## Smallest vertical slice

The first slice proves the delivery system. It does not attempt broad component coverage.

### Slice contents

1. **Checkbox parity:** Port the canonical `Checkbox` and `CheckboxProps` contract. Cover `xs`, `sm`, and `md`; default `sm`; unchecked, checked, and indeterminate values; controlled changes; disabled and read-only behavior; refs; native form submission; labels; focus; and keyboard behavior.
2. **Playground homepage:** Replace the marketing landing page at `/` with a product-shaped playground. Its shell has component and template navigation, a canvas, light and dark controls, desktop and mobile viewport controls, and reset behavior.
3. **Checkbox workbench:** Add a Checkbox entry with live controls for size, checked value, disabled state, and label. Add, remove, and reorder several Checkbox examples in a stack to prove the composition model without building a general visual editor.
4. **Minimal page frame:** Add a reusable local `PageFrame` with a sidebar, top bar, breadcrumbs, title, action slot, and content slot. It can use semantic HTML and local Tailwind layout until the full Scraps layout module is ported.
5. **Template workflow:** Add the template scaffold command and automatic discovery. Use it to create a `checkbox-settings` template that renders several labeled Checkboxes in a native form and shows the submitted form state.
6. **Shareable review state:** Serve the template at `/templates/checkbox-settings`. Persist its theme, viewport, and documented Checkbox state in the URL. Add a Share action that copies that exact state.
7. **Local browser proof:** Run the local app and test the real `/` workflow: open Checkbox, change its controls, reorder the stack, open the settings template, submit the form, change theme and viewport, copy the URL, and restore the same state in a second browser context using only the copied URL.
8. **Vercel Preview proof:** Push the slice branch, wait for its Vercel Preview, and repeat the share test with both the branch URL and the commit URL. Confirm that an intended reviewer can open and comment on the template without local setup.
9. **Figma component proof:** Create a Code Connect template for the existing canonical Checkbox Figma component at node `3481:4211` in the Sentry Components library. Map size, checked value, and disabled state to the compatible Checkbox API.
10. **Figma full-design proof:** Use the remote Figma MCP code-to-canvas workflow to capture the running Preview template as editable Figma layers.
11. **Round-trip proof:** Use a Figma test frame that contains an instance of the connected Checkbox. Change its size or checked state and the surrounding label copy in Figma, retrieve the frame through MCP, and update the local template. The resulting code must still import and use Checkbox.

### Slice prerequisites

- An approved Sentry page-frame Figma selection URL, including the exact desktop frame node, must be recorded before page-frame visual acceptance. If no canonical frame exists, the slice creates a minimal reference frame and gets design approval before continuing.
- The Sentry Components Figma library must be published and accessible to the tester.
- The tester must have a Figma seat and file permissions that support the selected Code Connect and MCP actions.
- The remote Figma MCP server must be connected to a supported client. Codex is supported for code-to-canvas.

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
pnpm figma:preview
```

The new scripts must be deterministic and documented. `test:playground` must exercise the local `/` workflow in a real browser. `test:templates` must validate metadata, unique slugs, discovery, direct routes, URL-state restoration, and production rendering. Agents run the development server through `portless` as required by `AGENTS.md`. `figma:parse` must run Code Connect parsing with unreadable files treated as failures. `figma:preview` must validate all slice templates before publication.

The Checkbox visual test matrix covers three sizes by three checked values by enabled and disabled states in both light and dark modes. The playground and page-frame smoke tests cover agreed desktop and mobile widths.

### Slice manual Figma pass criteria

The slice also requires a short test report that proves:

1. Dev Mode shows the expected Checkbox import and JSX for unchecked, checked, indeterminate, and disabled instances across the supported sizes.
2. Figma MCP design context for the test frame identifies the connected Checkbox and its selected props.
3. Generated prototype code uses the local public Checkbox module and passes the automated gate.
4. Code-to-canvas creates an editable Figma frame that matches the running Vercel Preview template at the tested viewport.
5. A changed Checkbox property and surrounding label make the return trip to the source template without replacing Checkbox with raw markup.

### Why this is the minimum useful slice

Checkbox is the smallest component that still tests types, native forms, controlled state, indeterminate state, keyboard input, focus, accessibility, visual states, and an existing canonical Figma mapping. The playground proves the actual designer entry point. The page frame and settings template prove local composition. Direct URLs and Vercel Preview prove asynchronous sharing. The two Figma checks test semantic design-to-code and editable code-to-canvas separately. Together they exercise every critical boundary before the remaining 47 modules are ported.

### Go or no-go experiment

Run the slice in this order:

1. Make Checkbox contract, behavior, accessibility, and visual tests pass inside Scrapcn.
2. Replace the marketing homepage with the local playground shell and Checkbox workbench.
3. Add the template scaffold, automatic discovery, reusable page frame, and `checkbox-settings` template.
4. Build and run Scrapcn locally, then exercise component controls, stack ordering, native form state, theme, viewport, URL-state restoration, and keyboard behavior in the browser.
5. Open the copied local Share URL in a second browser context and confirm the same review state.
6. Push the branch and repeat the share test on its Vercel branch and commit Preview URLs with another intended reviewer.
7. Parse and preview the Checkbox Code Connect template, publish it under the Scrapcn label, and inspect its variants in Dev Mode.
8. Ask the Figma MCP server to implement a small settings frame that contains the connected Checkbox. Confirm that the result imports Checkbox instead of recreating it.
9. Capture the running Vercel Preview template back to Figma as editable layers.
10. Change the Checkbox state and surrounding label in the connected Figma test frame, apply that change back to the source template, and rerun every automated check.
11. Give the written quick start to a designer or engineer who did not build the slice. Confirm the five-minute startup and ten-minute template-creation criteria without verbal help.

Proceed to the 48-module goal only when all 11 steps pass. A failure means the slice remains active until the shared pipeline is fixed. Do not work around a playground, template, Vercel Preview, page-frame, Figma, or documentation failure inside later component ports.

## Evidence format

Each completed slice or module records:

- Canonical Sentry commit and source paths.
- Scrapcn implementation and registry paths.
- Passing command output or CI links.
- Measured local startup and template hot-reload times.
- Storybook story and approved visual baseline.
- Template slug, local route, Vercel branch URL, and Vercel commit URL.
- Share-URL restoration result from a second browser context.
- Figma component and test-frame URLs.
- Code Connect parse result.
- Design-to-code and code-to-canvas smoke-test date.
- Approved exceptions, if any.

## Recommended first goal handoff

Use this objective for the first implementation goal:

> Implement the smallest vertical slice in `docs/scraps-parity-goal.md`. Replace the marketing homepage with the fast local playground, complete Checkbox contract parity, add the file-based template workflow, create the reusable Sentry page frame and `checkbox-settings` template, prove share-state restoration on a Vercel Preview, and add the Checkbox Code Connect template. Treat every automated playground, template, Preview, and manual Figma criterion as a completion gate. Record the required evidence. Keep registry transport and the remaining Scraps modules out of scope.

Before page-frame visual work starts, attach or record the approved Sentry page-frame node URL. If no canonical frame exists, create and approve the minimal reference as the first design deliverable. If the Figma library, permissions, or remote MCP connection are unavailable, implementation can continue through the automated gates, but the goal remains incomplete until the manual Figma gate passes.

## External references

- Figma MCP overview: <https://developers.figma.com/docs/figma-mcp-server/>
- Figma MCP tools: <https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/>
- Code to canvas: <https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/>
- Code Connect overview: <https://developers.figma.com/docs/code-connect/>
- Code Connect template files: <https://developers.figma.com/docs/code-connect/template-files/>
- Code Connect CLI: <https://developers.figma.com/docs/code-connect/cli-reference/>
- Figma file structure guidance: <https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/>
- Vercel Preview environments: <https://vercel.com/docs/deployments/environments>
- Vercel generated branch and commit URLs: <https://vercel.com/docs/deployments/generated-urls>
- Vercel Shareable Links: <https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links>
