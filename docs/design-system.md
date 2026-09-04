# Design System — portfolio.rakawidjaja.com

Design direction: **Editorial × Motion-Driven**. Oversized typography, generous negative
space, a restrained monochrome field, and one hot accent that only ever marks the thing you
should look at next. Motion carries meaning — it is never decoration.

Reference feel: `diveshborse.com` (editorial rhythm, case-study cards, calm density) and
`kaseyrandall.design` (anchor-nav sections, tagged project cards, dual theme).

---

## 1. Color

Dark is the default theme. `#333333` is the **surface** color — cards, nav, panels, modals —
not the page background. A deeper base beneath it creates elevation layers and lets
`#FF914D` actually burn.

### 1.1 Dark theme (default)

| Token | Hex | Use |
| --- | --- | --- |
| `--base` | `#1F1F1F` | Page background |
| `--surface` | `#333333` | Cards, nav bar, modals, code blocks |
| `--surface-2` | `#3D3D3D` | Hover / raised state on surface |
| `--surface-3` | `#474747` | Active / pressed, inset wells |
| `--border` | `#454545` | Hairlines, dividers, card outlines |
| `--border-strong` | `#5A5A5A` | Emphasized separators, input borders |
| `--ink` | `#F5F5F5` | Primary text |
| `--ink-muted` | `#A3A3A3` | Secondary text, meta, captions |
| `--ink-faint` | `#6E6E6E` | Disabled, decorative numerals |
| `--accent` | `#FF914D` | Links, active state, CTA, focus ring |
| `--accent-hover` | `#FFA76D` | Accent hover |
| `--accent-quiet` | `rgba(255,145,77,0.12)` | Accent tint fills, tag chips |
| `--scrim` | `rgba(15,15,15,0.72)` | Lightbox and modal backdrop |

### 1.2 Light theme

| Token | Hex | Use |
| --- | --- | --- |
| `--base` | `#FAFAFA` | Page background |
| `--surface` | `#FFFFFF` | Cards, nav, modals |
| `--surface-2` | `#F2F2F2` | Hover / raised |
| `--surface-3` | `#E8E8E8` | Active / pressed |
| `--border` | `#E0E0E0` | Hairlines |
| `--border-strong` | `#C7C7C7` | Input borders |
| `--ink` | `#333333` | Primary text — the brand color as ink |
| `--ink-muted` | `#5F5F5F` | Secondary text |
| `--ink-faint` | `#8A8A8A` | Disabled |
| `--accent` | `#FF914D` | Fills, large display type, graphics **only** |
| `--accent-text` | `#C2410C` | Accent used as body-size text or small icons |
| `--accent-quiet` | `rgba(255,145,77,0.14)` | Tint fills |
| `--scrim` | `rgba(30,30,30,0.55)` | Modal backdrop |

**`--accent-text` exists because `#FF914D` on `#FAFAFA` is 2.1:1 — it fails WCAG AA for
text.** In light mode, `#FF914D` is allowed for fills, borders, and display type ≥ 24px bold;
anything smaller uses `#C2410C` (4.96:1). In dark mode `#FF914D` passes everywhere (7.4:1 on
base, 5.7:1 on surface), so no substitution is needed.

### 1.3 Verified contrast

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `#F5F5F5` on `#1F1F1F` | 15.1:1 | AAA |
| `#F5F5F5` on `#333333` | 11.6:1 | AAA |
| `#A3A3A3` on `#1F1F1F` | 6.5:1 | AA |
| `#A3A3A3` on `#333333` | 5.0:1 | AA |
| `#FF914D` on `#1F1F1F` | 7.4:1 | AAA |
| `#FF914D` on `#333333` | 5.7:1 | AA |
| `#333333` on `#FAFAFA` | 12.1:1 | AAA |
| `#C2410C` on `#FAFAFA` | 5.0:1 | AA |
| `#FF914D` on `#FAFAFA` | 2.1:1 | **fails — never as text** |

A build-time script asserts every foreground/background token pair in this table. Adding a
color without adding its assertion fails CI.

### 1.4 Rules

- Components read semantic tokens only. A raw hex in a component is a review blocker.
- Accent appears at most **twice per viewport**. Exceeding that destroys its signalling value.
- Never convey meaning by color alone — pair with icon, label, or weight.
- Themes are authored together, not derived by inversion. Both are tested independently.

---

## 2. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display / headings | **Archivo** (`600`, `700`) | Wide grotesk, editorial weight. Variable font, one file. |
| Body | **Space Grotesk** (`400`, `500`) | Distinct enough to feel designed, calm enough to read long-form. |
| Meta / tags / code | **JetBrains Mono** (`400`, `500`) | Dates, tags, timeline years, tabular figures, code blocks. |

Loaded via `next/font/google` (subset latin, `font-display: swap`). Next downloads the
files at build time and serves them from our own origin, so this is self-hosted in effect —
there is no runtime request to Google and no FOIT — without checking font binaries into the
repo. Declared in `lib/fonts.ts`.

### 2.1 Scale

Fluid via `clamp()`. Values are min → max across 375px → 1440px.

| Token | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- |
| `display-xl` | `clamp(2.75rem, 9vw, 7.5rem)` | 0.95 | `-0.03em` | Hero name |
| `display-l` | `clamp(2.25rem, 6vw, 4.5rem)` | 1.02 | `-0.025em` | Section openers |
| `h1` | `clamp(2rem, 4vw, 3rem)` | 1.1 | `-0.02em` | Page titles |
| `h2` | `clamp(1.5rem, 2.6vw, 2rem)` | 1.2 | `-0.015em` | Section headings |
| `h3` | `1.25rem` | 1.3 | `-0.01em` | Card titles |
| `body-l` | `1.125rem` | 1.65 | `0` | Lead paragraphs |
| `body` | `1rem` | 1.7 | `0` | Default. Never below 16px on mobile. |
| `body-s` | `0.875rem` | 1.6 | `0` | Captions |
| `meta` | `0.75rem` | 1.4 | `0.08em` | Uppercase mono labels |

### 2.2 Rules

- Measure: 60–75 characters on desktop, 35–60 on mobile. Prose containers cap at `65ch`.
- Tabular figures (`font-variant-numeric: tabular-nums`) on dates, years, and timeline numbers.
- Hierarchy comes from size, weight, and space — never from color alone.
- Wrap rather than truncate. Where truncation is unavoidable, provide the full string.

---

## 3. Space, layout, radius, elevation

**8pt scale:** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160`

**Section rhythm:** `clamp(96px, 12vh, 160px)` vertical padding between major sections.

**Grid:** 12 columns desktop, 6 tablet, 4 mobile. Gutter `24px` mobile → `32px` desktop.
Container `max-width: 1280px`, side inset `clamp(20px, 5vw, 64px)`.

**Breakpoints:** `375 · 640 · 768 · 1024 · 1280 · 1440`. Mobile-first.

**Radius:** `sm 6px` (chips, inputs) · `md 12px` (cards) · `lg 20px` (media, modals) ·
`full` (pills, avatars).

**Elevation** — dark mode uses surface lightening, not shadow (shadows are invisible on
`#1F1F1F`):

| Level | Dark | Light |
| --- | --- | --- |
| 0 | `--base` | `--base` |
| 1 | `--surface` + 1px `--border` | `--surface` + `0 1px 2px rgba(0,0,0,.06)` |
| 2 | `--surface-2` + 1px `--border-strong` | `0 4px 16px rgba(0,0,0,.08)` |
| 3 (modal) | `--surface-2` + `0 24px 64px rgba(0,0,0,.6)` | `0 24px 64px rgba(0,0,0,.18)` |

**Z-index scale:** `base 0 · raised 10 · sticky-nav 40 · dropdown 50 · scrim 90 ·
modal/lightbox 100 · toast 1000`. No ad-hoc values.

---

## 4. Motion

Every animation must express a cause-and-effect relationship. If it does not, it is deleted.

### 4.1 Tokens — `lib/motion.ts`

```ts
export const spring     = { type: "spring", stiffness: 400, damping: 30 }
export const springSoft = { type: "spring", stiffness: 220, damping: 28 }

export const duration = { fast: 0.15, base: 0.24, slow: 0.4 }
export const ease = {
  out: [0.16, 1, 0.3, 1],      // entering
  in:  [0.7, 0, 0.84, 0],      // exiting
  inOut: [0.65, 0, 0.35, 1],   // moving in place
}
```

Every component imports these. No per-component spring configs.

### 4.2 Rules

| Rule | Value |
| --- | --- |
| Micro-interactions | 150–300ms |
| Complex transitions | ≤ 400ms |
| Exit duration | 60–70% of enter |
| List stagger | 40ms per item, capped at 8 items |
| Animated properties | `transform` and `opacity` only |
| Press feedback | `scale(0.97)`, released on pointer-up |
| Interruptibility | Every animation cancels on user input |
| Reveal trigger | IntersectionObserver, once, `rootMargin: -10%` |
| Reveal distance | 24px translate — never more, or it reads as jank |

Animating `width`, `height`, `top`, or `left` is forbidden. So is animating layout in a way
that shifts neighbors (CLS budget is 0.05).

### 4.3 Motion inventory

| Element | Behavior |
| --- | --- |
| Hero | Lazy WebGL field; headline mask-reveal on load, 40ms stagger per line |
| Section headings | Clip-path mask reveal upward on enter |
| Project cards | Enter staggered; hover lifts 4px, image scales 1.04, accent underline wipes |
| Sticky sections | Pinned scroll-scrub for the work intro only — one per page, no more |
| Parallax | 2 layers max, ±40px, `transform: translate3d` |
| Timeline | Progress rail draws with scroll; entries fade + slide in from the rail |
| Nav | Condenses on scroll past 80px: height 88→64, background gains blur + surface |
| Lightbox | Shared-element scale from the clicked thumbnail; scrim crossfades |
| Page transitions | 240ms crossfade + 8px rise; no full-screen wipes |
| Cursor | Desktop only, `hover: hover` — a small accent dot that scales over interactive targets |

### 4.4 Reduced motion

`prefers-reduced-motion: reduce` is a first-class path, not an afterthought:

- WebGL hero is never mounted; a static gradient poster renders instead.
- All reveals become instant opacity, no translate.
- Parallax, scroll-scrub pinning, and the custom cursor are disabled.
- Content and layout stay identical. Nothing becomes unreachable.

---

## 5. Three.js hero

The only WebGL on the site.

- Loaded with `next/dynamic(..., { ssr: false })`, mounted after first paint, so it never
  blocks LCP. The LCP element is the headline text, not the canvas.
- Rendered behind content at `z-index: 0`; text sits at `z-index: 10` with its own contrast
  guarantee independent of what the canvas draws.
- `dpr` clamped to `[1, 1.75]`. Frame loop pauses via IntersectionObserver when scrolled out
  of view and on `visibilitychange`.
- Hard budget: **≤ 130KB gzipped** for the three.js chunk. Import from `three/webgpu`-free
  ES modules and tree-shake; no `examples/jsm` kitchen sink.
- Skipped entirely when: reduced motion is requested, WebGL context creation fails,
  `navigator.hardwareConcurrency <= 4`, or `navigator.connection.saveData` is true.
- Fallback in every skip case is a CSS gradient + grain poster that is visually intentional,
  not a blank rectangle.

---

## 6. Components

| Component | Notes |
| --- | --- |
| `Nav` | Sticky, condenses on scroll, anchor links with scroll-spy. Persona and home variants are separate components — no shared links. Mobile: full-screen sheet, staggered items. |
| `ProjectCard` | Image (`next/image`, `aspect-ratio` reserved), title, one-line outcome, mono tag row. Whole card is one link; the lightbox trigger is a separate labeled button so the card link is never hijacked. |
| `Lightbox` | Focus-trapped dialog. Esc closes, ←/→ navigate, click scrim closes, body scroll locked. `aria-modal`, labelled by image caption. Preloads the adjacent image. |
| `Timeline` | `<ol>` semantically. Scroll-drawn rail, year in mono tabular figures. |
| `TagChip` | Mono uppercase, `--accent-quiet` fill, `--accent` text. Filter chips carry `aria-pressed`. |
| `BlogOutline` | Sticky sidebar from `h2`/`h3`. `aria-current="location"` on the active heading. Collapses to a disclosure above the article on mobile. |
| `ThemeToggle` | Icon button with `aria-label`. Writes `localStorage.theme`; an inline pre-paint script sets `data-theme` on `<html>` to prevent flash. |
| `Footer` | Social links, auto year. Persona variant contains no homepage link. |
| `Section` | Wrapper providing rhythm, id anchor, and the reveal observer. |

**Icons:** Lucide only. 1.5px stroke, 24px default. No emoji as icons, anywhere.

---

## 7. Accessibility floor

Non-negotiable. Any violation blocks merge.

- Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI glyphs — verified by the token test.
- Visible focus ring on every interactive element: `2px solid var(--accent)`, `2px` offset.
  `:focus-visible`, never removed.
- Full keyboard operation. Tab order matches visual order. Skip-to-content link first in DOM.
- Semantic HTML: `header`, `nav`, `main`, `article`, `section`, `ol`, `footer`. Sequential
  headings, no skipped levels.
- `aria-label` on every icon-only button. Descriptive `alt` on meaningful images, `alt=""`
  on decorative ones.
- Touch targets ≥ 44×44px with ≥ 8px separation.
- Zoom to 200% without horizontal scroll or clipped content.
- All text content renders with JavaScript disabled.
- `axe` runs in CI. Zero critical or serious violations.

---

## 8. Performance budget

| Metric | Budget |
| --- | --- |
| LCP (mobile, 4G) | < 2.0s |
| CLS | < 0.05 |
| INP | < 200ms |
| Initial JS (gzipped) | < 200KB |
| three.js chunk (gzipped, lazy) | < 130KB |
| Lighthouse, all four categories, mobile | ≥ 95 |

Enforced by a Lighthouse CI gate on every PR. Regression fails the build.

Practices: `next/image` with AVIF + WebP and explicit dimensions on everything; every
below-fold image `loading="lazy"`; fonts self-hosted, subset, preloaded, `swap`; heavy
components dynamically imported; scroll and resize handlers throttled to `rAF`; skeletons
that match final layout shape for anything over 300ms.

---

## 9. Anti-patterns

Explicitly rejected for this project:

- Corporate template layouts and generic hero-with-stock-photo compositions
- Emoji standing in for icons
- Accent color used as a background wash
- Animation with no causal meaning; more than two moving elements competing per viewport
- Motion that cannot be disabled
- Scroll-jacking, or pinned sections stacked back to back
- Raw hex values inside components
- Text below 16px in body copy
- Removed focus outlines
- Full-page loading spinners
- Any cross-link between homepage and a persona page (see `product.md` §2)
