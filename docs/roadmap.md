# Roadmap — portfolio.rakawidjaja.com

Nine milestones. Each is independently shippable and leaves the site in a deployable state.
`swe` is the only persona built; the registry abstraction makes persona #2 a content-only
change.

Companion docs: [`product.md`](./product.md) (scope, isolation rule, content model),
[`design-system.md`](./design-system.md) (tokens, motion, budgets).

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15, App Router, React 19 |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS v4, semantic tokens in `@theme` |
| Motion | Framer Motion + `three.js` (hero only, lazy) |
| Content | Typed TS registry + MDX via `next-mdx-remote` or `@next/mdx` |
| Validation | `zod` on MDX frontmatter, at build time |
| Icons | `lucide-react` |
| Testing | Playwright (e2e, a11y via `axe-core`, visual) |
| CI | GitHub Actions + Lighthouse CI |
| Hosting | Dokploy (staging, Docker) · Vercel free tier (production) |

Everything is statically generated. No database, no serverless functions, no runtime secrets.

---

## M0 — Foundation

Clean scaffold and the guardrails everything else depends on.

- Next 15 + TS strict + Tailwind v4 scaffold. Working tree is empty; the previous Next 14
  scaffold stays in git history for reference only.
- Design tokens in `app/globals.css` under `@theme`, both themes, exactly as specified in
  `design-system.md` §1.
- `lib/motion.ts` with the shared presets.
- Self-hosted fonts via `next/font/local` (Archivo, Space Grotesk, JetBrains Mono).
- Theme provider + pre-paint inline script that reads `localStorage.theme` and sets
  `data-theme` on `<html>` before first paint. No flash.
- ESLint + Prettier + `tsc --noEmit`.
- GitHub Actions: lint, typecheck, build on every PR.
- `lib/env.ts` and `.env.example` — both empty of required vars for now, present so the
  pattern exists before the first variable is added.

**Done when:** `npm run build` succeeds, both themes render correct tokens, CI is green,
theme choice survives reload with no flash.

---

## M1 — Homepage ✅

The neutral fallback. Small surface, must feel finished.

- Route group `app/(home)/` with its own layout — structurally separate from the persona
  layout so a shared link can never appear by accident. No nav: the page is one screen with
  nowhere to navigate to.
- Hero: name, one-line positioning, portrait.
- Contact links: email, LinkedIn, GitHub. No CV — it is per-persona and belongs to M6.
- Footer with auto year.
- `sitemap.xml` (homepage only) and `robots.txt` (silent on persona paths — see
  `product.md` §2.4 for why `Disallow` would leak the enumeration it means to hide).
- Root metadata, OG image, favicon set.
- `scripts/check-content.mjs` placeholder gate, wired into CI as its own step.
- `tests/homepage.mjs` — Playwright acceptance run: JS-disabled visibility, reduced motion,
  theme persistence and no-flash, focus ring in both themes, responsive overflow.
  `npm run test:e2e` against a running `npm start`. Deliberately **not** in CI yet: M7
  replaces it with `@playwright/test` + axe + the isolation assertions, and wiring a
  chromium download into every PR for a script that is about to be rewritten is waste.

**Done when:** homepage deploys, contains zero links to any persona route, Lighthouse ≥ 95.

### Measured (local, `npm run build && npm start`)

| Gate | Result |
| --- | --- |
| First Load JS | 108 kB — budget 200 kB |
| Lighthouse desktop | 100 / 100 / 100 / 100 |
| Lighthouse mobile (median of 5) | Perf 94 · A11y 100 · BP 100 · SEO 100 |
| CLS | 0.000 — budget 0.05 |
| `public/portrait.webp` | 42 KB — budget 120 KB |
| **LCP mobile** | **2.53s — budget 2.0s** ⚠ |

**LCP is over budget and unresolved.** What was ruled out: the image (15ms fetch, AVIF,
preloaded via srcset), the JS bundle (removing Framer entirely moved nothing), and an
opacity animation on the LCP element itself (fixed — that one was real, and cost ~1.7s of
render delay). What remains is main-thread render delay, measured under Lighthouse
`simulate` throttling at 4× CPU on the same machine that is serving the site; identical
builds scored 88–97, which is why the number above is a median. It needs a verdict against
a real host, not a better local run — **M8 re-measures against the deployed Vercel build
and that reading, not this one, decides whether the §8 budget is met.** If production also
misses, it is fixed there, not deferred further.

---

## M2 — Persona shell and hero

The routing abstraction plus the site's most expensive component.

- `content/personas.ts` registry, `Persona` type, `content/personas/swe.ts`.
- `app/[persona]/layout.tsx` + `page.tsx`, `generateStaticParams` from the registry.
- Unknown code → `notFound()`. Explicitly **not** a redirect to `/`.
- Per-persona metadata with `robots: { index: false, follow: false }`.
- Persona nav: sticky, scroll-condensing, anchor scroll-spy, mobile sheet. Logo scrolls to
  top; it is not a link to `/`.
- Hero section: mask-reveal headline, CTA.
- WebGL backdrop: dynamic import, `ssr: false`, mounted post-paint, IntersectionObserver +
  `visibilitychange` pause, dpr clamp, all four skip conditions from `design-system.md` §5,
  static gradient poster fallback.

**Done when:** `/swe` renders statically, `/xyz` 404s, hero holds LCP < 2.0s on throttled
mobile, `prefers-reduced-motion` renders the poster and never mounts the canvas.

---

## M3 — Work grid and lightbox

- `ProjectCard` per `design-system.md` §6 — card link and lightbox trigger are separate
  controls so the link is never hijacked.
- Filterable grid, tag chips with `aria-pressed`, staggered entrance.
- Lightbox: focus trap, Esc, arrow-key navigation, scrim click, body scroll lock,
  shared-element open from the clicked thumbnail, adjacent-image preload.
- Designed empty state for a filter that matches nothing.

**Done when:** grid and lightbox are fully keyboard operable, CLS stays under 0.05 while
filtering, axe reports zero violations on the section.

---

## M4 — Case studies

- MDX pipeline: `content/projects/swe/*.mdx`, zod-validated frontmatter, build fails on a
  malformed file.
- `app/[persona]/work/[slug]/page.tsx` with `generateStaticParams`.
- MDX component mapping to design-system typography, plus gallery and callout components.
- Gallery images reuse the M3 lightbox.
- Per-case-study OG metadata, still `noindex`.

**Done when:** every project links to a rendering case study, a bad frontmatter field fails
the build with a readable error.

---

## M5 — Blog

- `content/blog/swe/*.mdx`, same validated pipeline.
- `/[persona]/blog` list: title, date, reading time, tags, newest first, paginated at 10.
- `/[persona]/blog/[slug]`: title, date, author, reading time, MDX body.
- Outline sidebar built from `h2`/`h3` at build time, scroll-spy with `aria-current`,
  click-to-jump, disclosure collapse on mobile.
- Prev/next links scoped to the same persona.
- Designed empty state when a persona has no posts.

**Done when:** outline tracks scroll accurately, headings are deep-linkable, list paginates
correctly.

---

## M6 — Experience, skills, contact, footer

- Timeline as `<ol>`, scroll-drawn rail, mono tabular years, entries animating in from the rail.
- Skills grouped by category.
- Contact block: email, LinkedIn, GitHub, WhatsApp, CV download. No form.
- Persona footer: social links and auto year, no homepage link.

**Done when:** `/swe` is content-complete end to end.

---

## M7 — Quality gate

The milestone that makes the promises in `design-system.md` §7–8 enforceable rather than aspirational.

- Playwright e2e: homepage and `/swe` smoke, lightbox keyboard flow, theme persistence,
  blog outline scroll-spy, 404 on unknown persona.
- **Isolation test** — asserts no anchor on any persona route resolves to `/` or to another
  persona code, and that the homepage links to no persona route. This is the product's
  defining constraint; it gets a test, not a convention.
- `axe-core` pass on every route in both themes. Zero critical or serious violations.
- Visual regression snapshots at 375 / 768 / 1440.
- Token contrast assertion test covering the `design-system.md` §1.3 table.
- Lighthouse CI wired into the PR gate with the §8 budgets. Regression fails the build.
- Reduced-motion run: verify WebGL never mounts and all content stays reachable.
- JS-disabled run: verify all text content renders.

**Done when:** the full suite is green in CI and the budget gate blocks a deliberate regression.

---

## M8 — Deploy

- `Dockerfile`: multi-stage, `output: "standalone"`, non-root user, healthcheck.
- `.dockerignore`.
- Dokploy staging deploy documented in `docs/deploy.md`.
- Vercel production, `portfolio.rakawidjaja.com` custom domain, DNS, HTTPS.
- Verify security headers, `robots.txt`, and `sitemap.xml` on the live production origin —
  not just locally.
- Post-deploy Lighthouse run against production. **This is the authoritative reading of the
  §8 budgets** — the local M1 numbers were taken under 4× CPU throttling on a machine also
  serving the site. Settle the open M1 LCP finding here: if production LCP is under 2.0s,
  record it and close the item; if it is not, fix it in this milestone.

**Done when:** staging and production both serve the site, and a live `curl` confirms
persona routes are `noindex` and absent from the sitemap.

---

## Backlog — explicitly not scheduled

Pulled forward only on evidence of need.

- Additional personas (`cst`, `cc`, `pm`, `dsn`) — content-only work once M2 lands
- WYSIWYG studio that emits MDX
- Contact form (needs a backend and rate limiting)
- Analytics
- RSS feed — note this would leak persona blog URLs, so it needs an isolation review first
- i18n
- Full-text blog search

---

## Sequencing notes

- M0 → M2 are strictly sequential; M3–M6 could be parallelized across agents, but each owns
  distinct files.
- M7 can begin as soon as M3 lands; individual tests are added per milestone rather than all
  at the end. The isolation test specifically should be written during M2, when the routing
  abstraction is fresh, and extended thereafter.
- If a milestone breaks the M7 budget, fix it inside that milestone. Never defer a
  performance regression to a later cleanup pass.
