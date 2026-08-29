# Scrapscn

Scrapscn is a local playground for Sentry product interface prototypes. It ports regular Scraps components from the Sentry monolith to React and Tailwind. It also provides shadcn registry items as a release format.

The canonical source is `static/app/components/core` in `getsentry/sentry`. The current parity baseline is Sentry commit `a2db8365e2ec17c96b200bface596081c68f12c9`.

## Parity inventory

[`scraps-parity.json`](scraps-parity.json) is the machine-readable inventory for all 48 regular Scraps modules. It records the pinned canonical source files and public exports, mapped local files, registry items, stories, tests, Figma nodes, playground routes, and completion state.

The manifest records all 48 modules as complete. Select applies every nested `StylesConfig` pattern used by the pinned monolith through static Tailwind selectors. Its public type still accepts arbitrary new selectors, but applying an unknown selector to the default DOM is an owner-authorized portable-contract exclusion because it would require runtime CSS injection. Scrapscn keeps the complete callback result available to replacement components through `getStyles`.

Run `pnpm parity:validate` to check the inventory. The command fails when:

- A regular Scraps module or public export differs from the pinned contract.
- A claimed local file, registry item, or Figma node is invalid.
- The recorded local exports no longer match the implementation.
- A local UI component is neither mapped to a regular Scraps module nor marked as out of scope.
- A module is marked complete without its required machine-checkable artifacts and exports.

Run `pnpm parity:generate` only when you intentionally refresh the inventory from a local `getsentry/sentry` checkout at the pinned commit. Set `SENTRY_REPO_PATH` if that checkout is not at `../sentry`.

## Start a prototype

You need Node.js 24 or later and pnpm. This checkout pins Next.js to 16.3.3 and uses Oxlint and Oxfmt instead of ESLint and Prettier. It uses shadcn 4.19.x and Tailwind CSS 4.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Next.js. The homepage is the playground. It needs no Sentry monolith, account, database, environment variable, or external service.

The preview fills the viewport. Open the floating setup island at the bottom of the page to choose any regular Scraps workbench or a page template. The island exposes the selected component's public controls, light and dark modes, preview widths, and reset behavior. It closes when you press Escape, move focus into the preview, or click outside it. Select **Share** on a template to copy an absolute URL that restores the current review state.

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

Scrapscn has 11 local Code Connect templates for Alert, FeatureBadge, Tag, Button, Checkbox, EmptyState, Radio, Slider, Switch, TextArea, and Tooltip. They use pinned Sentry Figma node URLs and canonical property names. The connection label is `Scrapscn React`, so it remains distinct from the monolith connection.

Run the local syntax check without credentials:

```bash
pnpm figma:parse
```

The parser checks local syntax, node URLs, imports, parserless format, and pinned property vocabulary. Remote publication, Dev Mode verification, Figma MCP, code-to-canvas, and round-trip tests are release work. They are outside the current parity goal.

The local page frame is a source-grounded structural prototype. It is not a claim that Sentry has an approved page-frame Figma node.

## Review visual parity locally

Start Scrapscn with `pnpm dev`. In a Sentry checkout pinned to `a2db8365e2ec17c96b200bface596081c68f12c9`, run Sentry dev UI with `SENTRY_WEBPACK_PROXY_PORT=8000 pnpm dev-ui`. Open the same module in two browser windows. For Checkbox, use:

- Scrapscn: append `/?component=checkbox&theme=dark&viewport=desktop` to the URL printed by `pnpm dev`
- Sentry catalog: `https://sentry.dev.getsentry.net:8000/organizations/sentry/scraps/core/checkbox/?theme=dark#examples`

The Sentry catalog needs a local Sentry session and organization context. Open `https://sentry.dev.getsentry.net:8000/auth/login/` first and sign in. The login form can take a few seconds to replace the initial loader. The review workflow requires the Sentry checkout at the pinned comparison commit. Set `SENTRY_REPO_PATH` to that checkout and `SENTRY_REVIEW_ORIGIN=https://sentry.dev.getsentry.net:8000` when running `pnpm visual:review`. Set `SENTRY_ORG_SLUG` when your local organization slug is not `sentry`. Then open the catalog URL above. Compare every documented size, variant, disabled state, focus state, open state, and responsive width. Record approval before treating a screenshot as a baseline. A screenshot of Scrapscn alone only locks the current implementation. It does not prove parity with Scraps.

## Checks

```bash
pnpm test
pnpm lint
pnpm build:next
pnpm build-storybook
pnpm test:playground
pnpm test:templates
pnpm figma:parse
```

`test:playground` starts a controlled production server, completes the real browser workflow, and restores the copied URL in a second browser context. `test:templates` validates metadata, discovery, scaffold behavior, imports, and production routes.

The full end state and exact completion gates are in [docs/scraps-parity-goal.md](docs/scraps-parity-goal.md). The parity manifest is the authority for module status. The 192 deterministic local visual baselines and the reviewed canonical comparison evidence are present. See [docs/visual-baselines.md](docs/visual-baselines.md).

## Registry release format

Registry installation is not the first parity test. After a module passes the local playground and Figma gates, it can be published as a shadcn item. Existing registry consumers can install the base theme with:

```bash
npx shadcn add https://scrapscn.sentry.dev/r/sentry-base
```
