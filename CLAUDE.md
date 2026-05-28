@AGENTS.md

# Scrapscn

Sentry's design system as a shadcn-compatible registry. Next.js + Tailwind v4 + shadcn CLI v4.

## Brand source of truth

The sentry-brand skill (in sentry-for-ai) is the canonical brand reference. This repo consumes those tokens — it does not define them. When in doubt, check:
- Sentry product tokens: `getsentry/sentry` → `static/app/utils/theme/scraps/`
- Brand guidelines: `live.standards.site/sentry`

## Key files

- `src/app/globals.css` — All CSS variables (oklch). Light + dark mode. This IS the theme.
- `src/app/page.tsx` — Showcase page (components, tokens, voice, motion)
- `registry.json` — shadcn registry manifest
- `public/` — Sentry logo SVGs + fuzzy-dot gradient texture

## Conventions

- Colors in oklch format with hex in comments
- All text colors must pass WCAG AA (4.5:1) on their paired surface
- Sentry-specific tokens beyond shadcn defaults: `--warning`, `--success`, `--promotion`
- Typography: Dammit Sans (headlines only, font-weight: normal), Rubik (body), Roboto Mono (code)
- Sentence case always. No "!" in CTAs. Voice is dry, informative, self-aware.
- Sentry uses purple-tinted neutrals, never pure black or pure grey

## Commands

```bash
npm run dev    # localhost:3000
npm run build  # type-check + build
```

## Deploy

Vercel (Sentry team) → scrapscn.sentry.dev. Auto-deploys on push to main.
