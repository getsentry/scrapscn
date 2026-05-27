# Sentry Brand Reference

Extracted from live.standards.site/sentry + getsentry/sentry GitHub.

## Voice & Tone

Sentry sounds like a real person who isn't trying to sell you something.

**Core traits:**
- **Informative** — straightforward, accurate info. No manipulation.
- **Self-aware** — "we know we're not curing cancer." No bold aspirational claims.
- **Unexcitable** — not bubbly. Use "!" sparingly (better for sarcasm, not CTAs).
- **Plain English** — American spelling, no jargon. Write how you speak.
- **Fun** — the subject matter is dry, so look for opportunities to add levity.
- **Gets our users** — they should feel understood, not marketed to.

**Humor style:**
- Snarky and dry, but still approachable
- Think "veteran on the dev team who's seen some stuff"
- Poke fun at universal dev struggles (errors, late-night pages, confusing logs)
- Keep jokes tight — one line, punchy, move on
- DON'T get slapstick, make fun of users, or overdo sarcasm

**Writing rules:**
- Sentence case always (not Title Case)
- No end punctuation on titles except question marks
- Proper nouns capitalized (Sentry, Session Replay, etc.)

## Brand Colors

### Primary
| Name | Hex | CMYK | Usage |
|------|-----|------|-------|
| Black | #181225 | 35/51/0/85 | Primary dark (not pure #000) |
| White | #FFFFFF | 0/0/0/0 | Primary light |
| Blurple | #7553FF | 54/67/0/0 | Primary accent |

### Secondary
| Name | Hex | CMYK | Usage |
|------|-----|------|-------|
| Violet | #36166B | 94/100/23/17 | Deep purple |
| Hot Pink | #FF45A8 | 0/85/0/0 | Promotion/CTA |
| Orchid | #A737B4 | 45/86/0/0 | Secondary purple |
| Yorange | #FDB81B | 0/31/98/0 | Warning/highlight |
| Green | #92DD00 | 47/0/100/0 | Success |
| !White | #F6F6F8 | 2/2/1/0 | Off-white background |

### Color usage priority
1. Blurple + Black + White (primary)
2. Violet, Hot Pink (supporting)
3. Orchid, Yorange, Green, !White (accents)

### Accessibility
Always ensure good contrast between text and background colors.

## Product Design Tokens (from GitHub)

### Neutral Dark Scale
| Token | Hex |
|-------|-----|
| opaque100 | #0D0A10 |
| opaque200 | #141119 |
| opaque300 | #1B1821 |
| opaque400 | #24202B |
| opaque500 | #2E2936 |
| opaque600 | #393442 |
| opaque700 | #46404F |
| opaque800 | #534D5E |
| opaque900 | #898294 |
| opaque1000 | #958E9F |
| opaque1100 | #A49EAE |
| opaque1200 | #B5B0BD |
| opaque1300 | #C4C0CB |
| opaque1400 | #D5D2DA |
| opaque1500 | #E7E5EA |
| opaque1600 | #F9F8F9 |

### Neutral Light Scale
| Token | Hex |
|-------|-----|
| opaque100 | #F8F8F9 |
| opaque200 | #F0F0F2 |
| opaque300 | #E6E6E9 |
| opaque400 | #DAD9DE |
| opaque500 | #CDCCD2 |
| opaque600 | #C0BEC6 |
| opaque700 | #B1AFB8 |
| opaque800 | #A29FAA |
| opaque900 | #878490 |
| opaque1000 | #787581 |
| opaque1100 | #6A6772 |
| opaque1200 | #5B5864 |
| opaque1300 | #4C4954 |
| opaque1400 | #3E3B45 |
| opaque1500 | #302E36 |
| opaque1600 | #181225 |

### Semantic Theme Tokens

**Light mode:**
| Token | Hex | Sentry mapping |
|-------|-----|----------------|
| bg.primary | #FFFFFF | white |
| bg.secondary | #F8F8F9 | neutral.light.opaque100 |
| bg.tertiary | #F0F0F2 | neutral.light.opaque200 |
| bg.overlay | #FFFFFF | white |
| accent.vibrant | #7553FF | blue.light.opaque1000 |
| promotion.vibrant | #FC5CB4 | pink.light.opaque800 |
| danger.vibrant | #FF002B | red.light.opaque1000 |
| warning.vibrant | #FFCE00 | yellow.light.opaque600 |
| success.vibrant | #00F261 | green.light.opaque800 |

**Dark mode:**
| Token | Hex | Sentry mapping |
|-------|-----|----------------|
| bg.primary | #2E2936 | neutral.dark.opaque500 |
| bg.secondary | #24202B | neutral.dark.opaque400 |
| bg.tertiary | #1B1821 | neutral.dark.opaque300 |
| bg.overlay | #393442 | neutral.dark.opaque600 |
| accent.vibrant | #7553FF | blue.dark.opaque900 |
| promotion.vibrant | #FF45A8 | pink.dark.opaque1000 |
| danger.vibrant | #FF002B | red.dark.opaque900 |
| warning.vibrant | #FFCE00 | yellow.dark.opaque1200 |
| success.vibrant | #00F261 | green.dark.opaque1100 |

## Typography

### Fonts
- **Dammit Sans** (custom) — Headlines/H1 only. Bold weight. (dammitsansv0.2-bold.otf)
- **Rubik** — Everything else. Google Fonts. Pleasant rounded corners, sturdy geometric forms.
  - Regular (400) — body text
  - Medium (500) — subheads
  - Bold (700) — emphasis
  - All have italic variants
- **Roboto Mono** — Code (product UI only)

### Type Scale (product)
| Size | Value |
|------|-------|
| xs | 11px |
| sm | 12px |
| md | 14px |
| lg | 16px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 32px |
| 4xl | 40px |

### Line Heights
| Name | Value |
|------|-------|
| compressed | 1 |
| default | 1.2 |
| comfortable | 1.4 |

### Type rules
- Always have clear contrast between headers, subheads, and body
- Minimum 1.5x scale difference between heading levels
- Avoid more styles than needed

## Spacing

| Token | Value |
|-------|-------|
| 0 | 0px |
| 2xs | 2px |
| xs | 4px |
| sm | 6px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| 2xl | 24px |
| 3xl | 32px |

## Radius

| Token | Value |
|-------|-------|
| 0 | 0px |
| 2xs | 3px |
| xs | 4px |
| sm | 5px |
| md | 6px |
| lg | 8px |
| xl | 12px |
| 2xl | 16px |
| full | 999px |

## Border

| Token | Value |
|-------|-------|
| 0 | 0px |
| md | 1px |
| lg | 1.5px |
| xl | 2px |
| 2xl | 4px |

## Illustration Style

- Textured, organic brushes — warmth and life
- Grain textures, thin highlights along edges, soft natural shadows
- Diverse characters with exaggerated proportions
- Modern/retro/sci-fi tech: buttons, switches, knobs, cables
- Bugs, robots, glitches for depicting errors/issues
- Sentry glyph personified as a character (use sparingly)
- DON'T: mix flat with textured, use crisp harsh shadows, use large pillowy bevels

### Gradients
Both simple linear and complex mesh gradients depending on situation.

## Motion

- Glyph lends itself to playful motion
- Slow for storytelling, snappy for hype, clean swipes for demos
- Every transition should feel intentional and on-brand
- On-brand captions for accessibility

### Ease curves
Fast: 120ms, Moderate: 160ms, Slow: 240ms
Curves: smooth, snap, enter, exit, spring

## Logo

- Two elements: triangular glyph + all-caps SENTRY wordmark
- Usually horizontal arrangement
- Glyph-only for limited space
- Glyph is equilateral triangle — adjust vertical centering upward
- Clearspace: at least width of wordmark's "S" around logo
- Partner lockups: matching monochrome, separated by vertical rule

## Available Brand Assets (141 files)

### Fonts
- Rubik-Regular.ttf, Rubik-Medium.ttf, Rubik-Bold.ttf
- Rubik-Italic.ttf, Rubik-MediumItalic.ttf, Rubik-BoldItalic.ttf
- dammitsansv0.2-bold.otf
- sentry-fonts.zip (bundle)

### Logo
- sentry-glyph.svg
- sentry-wordmark-dark-400x119.svg
- sentry-logo-files.zip
- Logo animations: logo_log.gif, logo_guts.gif, logo_lockup.gif, logo_sherbert.gif, logo-sizzle.gif

### Illustrations
- illustration-01.jpg through illustration-20.jpg
- illustration-sizzle.gif
- glyph-character-voxel.jpg

### Color examples
- color-examples-01.jpg through color-examples-04.jpg
- color-move.mp4

### Gradients
- gradients-01.png through gradients-04.png
- sentry-noise-bgs.zip

### Typography examples
- type-example-01.jpg/png through type-example-05.jpg
- type rules.png, typesetting-example.png
- type animations: type_slide.gif, type_slideup.gif, type_zoom.gif

### Motion/Video
- brandhero.mp4, ease animations (gif), motion section videos
