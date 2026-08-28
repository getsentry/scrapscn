# Visual baseline workflow

The local visual suite covers all 48 regular Scraps modules. It records four images for each
module: light and dark themes at 390 × 844 and 1280 × 900 viewports. The committed set contains
192 PNG files in `tests/visual/__screenshots__/scraps.visual.spec.ts`.

The 192 PNG files are local regression baselines only. They do not prove parity with Scraps.
Paired evidence uses an explicit scenario contract in `scripts/visual-scenario-contract.mjs`, plus
new local and canonical captures with SHA-256 metadata. The review result is stored in
`tests/visual/visual-review.json`.

## Reference environment

- Canonical Sentry commit: `a2db8365e2ec17c96b200bface596081c68f12c9`
- Host: macOS 26.6.1, arm64
- Playwright: 1.60.0
- Browser: Chrome for Testing 148.0.7778.96
- Locale and time zone: `en-US`, UTC
- Device scale factor: 1
- Motion preference: reduced

The snapshots are platform-specific. Update them only in this reference environment unless the
team intentionally changes the reference host.

## Run the checks

Run `pnpm test:visual` to compare the application with the committed PNG files. The command builds
the production Next.js application, starts it through Portless, and runs all 192 comparisons in one
Chromium worker.

Run `pnpm test:visual:update` only after an intentional visual change. The command first verifies
the reference host, replaces the committed PNG files, and then runs a separate comparison pass. A
green result means the captures are deterministic. It does not approve the new appearance.

Save an authenticated Playwright-compatible browser state at
`.auth/sentry-playwright.json`, or set `SENTRY_AUTH_STATE` to another ignored local path. Then run
the canonical capture once:

```sh
SENTRY_REPO_PATH=/path/to/pinned-sentry \
pnpm visual:canonical:capture
```

Run `pnpm visual:local:capture`, then `pnpm visual:canonical:capture`, then
`pnpm visual:review`. Review the report, record the scenario approvals, and run
`pnpm visual:validate` as the strict final gate.
The canonical command accepts only `https://sentry.dev.getsentry.net:8000`; it verifies that the
single port 8000 listener is the clean, pinned Sentry checkout before it opens a browser. It never
starts, stops, or proxies Sentry. The capture promotes the first canonical `Storybook.Demo` to a
full-screen surface, so catalog navigation and documentation do not enter the comparison. Run
`pnpm visual:review` last to create
`test-results/visual-review/index.html` with side-by-side, opacity-overlay, and difference views.

## Approve parity

1. Check out Sentry at `a2db8365e2ec17c96b200bface596081c68f12c9`. Start Scrapscn through
   Portless. In the pinned Sentry checkout, start Sentry dev UI directly with
   `SENTRY_WEBPACK_PROXY_PORT=8000 pnpm dev-ui`.
2. Sign in at `/auth/login/` on the same Sentry origin used for the review. The default is
   `https://sentry.dev.getsentry.net:8000/auth/login/`.
3. Run both paired capture commands, then generate and open the review.
   The canonical capture fails when the Sentry checkout or its port 8000 listener is not the pinned,
   clean checkout. Set
   `SENTRY_ORG_SLUG` first when your local organization slug is not `sentry`. Do not run Sentry dev
   UI through Portless.
4. Review the representative paired scenario for each family in all four views. The scenario
   contract records secondary canonical pages as scoped exclusions until the playground has a
   matching isolated local scenario. The 192-image local suite continues to cover every module in
   light, dark, narrow, and wide views.
5. Fix mismatches and regenerate the affected snapshots. Do not increase screenshot tolerances to
   hide a mismatch.
6. Record each paired-scenario result in `tests/visual/visual-review.json`, including the generated
   evidence hash. Small composition or captured-state differences may be non-blocking, but a
   component mismatch must remain blocking. Run `pnpm visual:validate` after the ledger is complete.

The earlier 192-local/172-canonical review used unmatched family pages and is obsolete. Completion
requires fresh paired metadata, image-bound approvals, and a green `pnpm visual:validate` result.
