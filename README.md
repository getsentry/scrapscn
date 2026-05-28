# scrapscn

Sentry's design system as a [shadcn](https://ui.shadcn.com) registry.

One command to theme any shadcn project with Sentry's purple-tinted neutrals, Blurple accent, and Rubik typography — both light and dark modes.

```bash
npx shadcn add https://scrapscn.sentry.dev/r/sentry-base
```

## What's included

- **26+ semantic CSS variables** mapped from Sentry's product design tokens (oklch)
- **Custom tokens** beyond shadcn defaults: `--warning`, `--success`, `--promotion`
- **Chonky buttons**: Sentry's signature raised embossed depth effect with snap easing
- **Debossed inputs**: Pressed-in feel with inset shadows, matching the product UI
- **Semantic Badge & Alert variants**: `info`, `success`, `warning`, `danger`, `promotion`, `muted` — plus feature badges (`alpha`, `beta`, `new`)
- **Chonky Switch**: Debossed track, embossed thumb, crossfading check/close icons
- **Typography**: Dammit Sans (headlines), Rubik (body), Roboto Mono (code)
- **Both modes**: Light and dark are first-class citizens — purple-tinted neutrals, never pure black
- **WCAG AA compliant**: All text/surface pairs pass 4.5:1 contrast

## Development

```bash
pnpm install
pnpm dev
```

## Deploy

Auto-deploys to [scrapscn.sentry.dev](https://scrapscn.sentry.dev) via Vercel on push to `main`.

## Brand reference

This repo consumes Sentry's brand tokens — it doesn't define them. The canonical sources are:

- **Product tokens**: [`getsentry/sentry`](https://github.com/getsentry/sentry) → `static/app/utils/theme/scraps/`
- **Brand guidelines**: [live.standards.site/sentry](https://live.standards.site/sentry)
