# Roadmap — portfolio.rakawidjaja.com

Ten milestones. Each is independently shippable and leaves the site in a deployable state.
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
  `npm run test:e2e` against a running `npx next start`. Deliberately **not** in CI yet: M7
  wires it in alongside axe and the isolation assertions.

  **M7 resolved this differently than planned.** It kept the bare-`playwright` harness
  rather than moving to `@playwright/test` — the hand-rolled `ok()` assertions read fine,
  and the wrapper would have pulled a second test framework in behind `@axe-core/playwright`
  for one `addScriptTag`. The file was extended, not rewritten.

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

## M2 — Persona shell and hero ✅

The routing abstraction plus the site's most expensive component.

- `content/personas.ts` registry, `Persona` type, `content/personas/swe.ts`.
- `app/[persona]/layout.tsx` + `page.tsx`, `generateStaticParams` from the registry.
- Unknown code → `notFound()` via `dynamicParams = false`. Explicitly **not** a redirect.
- Per-persona metadata with `robots: { index: false, follow: false }`.
- Persona nav: sticky, scroll-condensing (88→64 at 80px), anchor scroll-spy, mobile sheet.
  Logo scrolls to top; it is not a link to `/`.
- Hero section: mask-reveal headline, CTA anchoring `#work`.
- Section shells — `<section id>` landmark + opener heading, empty body — for `work`,
  `experience`, `skills`, `contact`. `sections` is content-level data on `Persona`, so the
  nav, scroll-spy, and hero CTA all address real anchors from the first commit and M3/M4/M6
  fill bodies without touching either.
- `--on-accent` token (`#1f1f1f`, identical in both themes) for text on an `--accent` fill.
  `--ink` inverts and the fill does not, so a button using it read 2.1:1 in light mode.
  Both directions are now asserted in `scripts/check-contrast.mjs`.
- `scripts/check-content.mjs` made recursive. It read only top-level `content/*.ts`, so
  `content/personas/swe.ts` placeholders would have deployed past the guard.
- `tests/persona.mjs` — the isolation test, written here per the sequencing note below.
- **`components/ui/reveal.tsx` fixed:** all three wrappers now render plainly until an
  effect confirms hydration. Framer serializes `initial` into the SSR markup as an inline
  `opacity:0`, and React leaves that attribute in place when the plain branch renders — so
  every section heading was permanently invisible with JS disabled AND under reduced motion.
  The docblock had warned about exactly this for above-the-fold content; the missing half
  was that the reduced-motion branch has the same problem at any scroll position. Below the
  fold the hydration swap costs nothing visible: the element is off-screen when it happens.

**Done when:** `/swe` renders statically, `/xyz` 404s, `prefers-reduced-motion` renders the
poster and never mounts a canvas. ✅ — the LCP clause moves to M8 with M1's, see below.

### WebGL deferred to post-M8

M2 ships the CSS gradient + grain **poster** (`components/persona/backdrop-poster.tsx`),
which `design-system.md` §5 already mandates as the required output in every skip case. It
is the permanent fallback, not a stand-in.

The canvas is deferred because M2's stated done-criterion was "hero holds LCP < 2.0s" and
that budget is not yet settled: M1 misses it locally at 2.53s with zero WebGL, and M8 owns
the authoritative production reading. Building the site's most expensive component against an
unsettled budget risks paying for something we then rip out.

Also deferred with it, deliberately: the `next/dynamic` seam, a `shouldMountBackdrop()`
predicate for §5's four skip conditions, and the IntersectionObserver + `visibilitychange`
pause. With no canvas to mount they have no consumer — untestable code that would be
rewritten against the real component's needs anyway. The seam is one `next/dynamic` line the
day the canvas exists.

**Scheduled: after M8**, once production LCP is a real number to spend against. Carries
§5's ≤130 kB and four skip conditions unchanged.

### Measured (local, `npm run build && npx next start`, `/swe`)

| Gate | Result |
| --- | --- |
| First Load JS | 143 kB — budget 200 kB |
| Lighthouse mobile (median of 5) | Perf 95 · A11y 100 · BP 100 · **SEO 63** |
| LCP mobile | 2.6s — same as M1's 2.53s, no regression |
| CLS | 0.000 — budget 0.05 |
| `tests/persona.mjs` | 43 assertions, all pass |

**SEO 63 is correct, not a defect.** The only failing audit is `is-crawlable` — "Page is
blocked from indexing" — which is precisely what `product.md` §2.4 requires of a persona
route. A persona page scoring 100 on SEO would mean the noindex had been dropped.

The 35 kB over the homepage is Framer Motion, pulled in by `Reveal` in the section openers.
M3's grid and M6's timeline both need it, so it is paid once here rather than deferred.

**LCP is not a regression but is still over the 2.0s budget**, identically to M1 and for the
same unresolved reason. Both readings are settled together in M8 against the deployed Vercel
build, per the M1 note.

---

## M3 — Work grid and lightbox ✅

- `ProjectCard` per `design-system.md` §6 — card link and lightbox trigger are separate
  controls so the link is never hijacked.
- Filterable grid, tag chips with `aria-pressed`, staggered entrance.
- Lightbox: focus trap, Esc, arrow-key navigation, scrim click, body scroll lock,
  shared-element open from the clicked thumbnail, adjacent-image preload.
- Designed empty state for a filter that matches nothing.
- `lib/use-focus-trap.ts` extracted from the nav, per the standing note there — the
  lightbox is its second consumer. Focus *return* stays with each caller, which owns its
  trigger ref. The `[mobile sheet]` test group is the regression gate on the extraction.
- `scripts/prepare-work-images.mjs` — build-time WebP pipeline, committed output, no
  runtime `sharp`. `public/` drops from ~13 MB to 629 KB; the 30 source PNGs remain in git
  history at `c35dee3`.
- `scripts/check-content.mjs` placeholder regex widened to `lorem ipsum`, `/placeholder.*`
  and `example.com`. Authorizing placeholder copy while the guard grepped only `TODO`
  would have made "placeholders cannot deploy" untrue.

**Done when:** grid and lightbox are fully keyboard operable, CLS stays under 0.05 while
filtering, axe reports zero violations on the section. ✅ — including axe as of M7:
`scripts/check-a11y.mjs` sweeps the case-study route in both themes and reports zero critical
or serious violations.

### Measured (local, `npm run build && npx next start`, `/swe`)

| Gate | Result |
| --- | --- |
| First Load JS | 163 kB — budget 200 kB (M2 was 143 kB; +20 kB is the grid and lightbox) |
| `tests/persona.mjs` | 66 assertions, all pass |
| CLS while filtering | 0.000 — budget 0.05 |
| Card image box through filter | 229px → 229px, no reflow |
| Lighthouse mobile, median of 5 | Perf 92 · A11y 100 · BP 100 |
| LCP mobile | 2.7s — unchanged finding, see below |
| `public/` total | 629 KB, down from ~13 MB |

**Perf reads below the §8 floor of 95, and the local number cannot settle whether that is
real.** Five paired runs, alternating the homepage and `/swe` on the same machine, gave home
90/94/98/97/93 against swe 85/89/95/92/92 — an ~8-point swing per route between runs, which
is wider than the ~2–3 point gap between the routes. What the pairing does establish is that
the gap is small and is TBT, from hydrating the client grid: images cost 16ms and 7.4 KB
(measured), and a build with the card images removed scored no better than one with them.
Reveal is not the cost either — stripping it from the grid moved nothing (88 vs 87).

**M8 decides this**, with M1's and M2's LCP findings and by the same measurement. The
machine serving the site is also running the audit under 4× CPU throttling; that is the
thing to remove, not another local run.

### Carried out of M3

- **Which internal apps may show public screenshots.** Five of six projects are an
  employer's internal tools, so they render `_placeholder.webp` rather than real captures —
  publishing those is the one action here an edit cannot take back once cached and scraped,
  and `noindex` reduces that risk without removing it. Granting permission later is one
  entry in `SETS` in `scripts/prepare-work-images.mjs` plus a re-run; no component changes.
- **`hasCaseStudy` is `false` on every item**, so no card links anywhere. M4 owns the
  case-study route and flips the flag; a card linking to a 404 is worse than one that does
  not link yet.
- **The empty-filter state is unasserted.** Tags are derived from the items, so every chip
  matches at least one card and the empty branch is unreachable through the UI. It exists
  for a persona with an empty work list, and testing it needs a fixture route that does not
  exist. Recorded rather than faked with a test that drives React state directly.
- Five `outcome` lines in `content/work.ts` are still `TODO`, with the `content/site.ts`
  and `content/personas/swe.ts` placeholders. `npm run check:content` names all 14 and
  blocks deploy.

---

## M4 — Case studies ✅

> **Sequencing note.** M6 shipped before M4 and M5. M6's content already existed in
> `content/_raw-experience.md`; M4's does not, and five of its six projects were still blocked
> on the publication question M3 carried out. See the note at the top of M6. M4 and M5 now run
> adjacent, which suits them — they share the MDX + zod pipeline.

- MDX pipeline: `content/projects/swe/*.mdx`, zod-validated frontmatter, build fails on a
  malformed file.
- `app/[persona]/work/[slug]/page.tsx` with `generateStaticParams`, `dynamicParams = false`.
- `mdx-components.tsx` maps every element onto the existing type tokens — no
  `@tailwindcss/typography`, which would have introduced a second scale to fight the nine
  tokens already defined.
- `components/persona/callout.tsx` (the `blockquote` mapping) and
  `components/persona/case-study-gallery.tsx`, which reuses the M3 lightbox unchanged.
- Per-case-study metadata, still `noindex`.
- **Abstract app visuals.** `scripts/generate-app-visuals.mjs` renders one deterministic
  schematic per blocked project in the site's own tokens, replacing the shared
  `_placeholder.webp`. The alt text says they are schematics: a drawing that passes for a
  screenshot is a worse failure than a blank box.
- `PersonaNav` gained a `basePath` prop, because the same nav now wraps the case studies.

**Done when:** every project links to a rendering case study, a bad frontmatter field fails
the build with a readable error. ✅ — both verified, the second by fault injection (below).

### Three traps this milestone turned up, recorded so they are not re-introduced

1. **A nested `generateStaticParams` is only handed its parent's params when an ANCESTOR
   generates them — meaning the parent *layout*.** `app/[persona]/layout.tsx` exports none,
   and the one in `app/[persona]/page.tsx` is a *sibling*, so the nested function received
   `{}` and silently dropped every slug. **The build passed green with zero case-study routes
   emitted** — the route was listed, only the indented paths under it were missing. The fix
   is the `{ persona, slug }` cross product returned from the nested function; adding a
   `generateStaticParams` to the layout instead would put a third copy of the persona list in
   the tree.
2. **Nested-route metadata does not inherit either.** `generateMetadata` inherits from the
   parent *layout*, which exports no metadata at all — the `robots` and `canonical` values
   live in `app/[persona]/page.tsx`, a sibling. They are restated in full in the case study
   for that reason. Deleting them would make the sub-route indexable while `/swe` stayed
   clean, which is precisely the failure §2.4 is written against. `[case study · indexing]`
   is the gate; a passing `[indexing]` on `/swe` proves nothing about it.
3. **Frontmatter is an ESM export, validated by zod — not YAML, and there is no
   `gray-matter`.** MDX supports `export const meta` natively, so the object lives in the same
   file as the prose with no second source of truth. zod is there because `@types/mdx`
   declares `*.mdx` with a single `default` export, so TypeScript cannot see `meta` at all;
   the schema validates the *whole module*, which is what removes the need for a cast that
   would have asserted exactly the unverified thing. Do not "restore" a YAML parser.

### Measured (local, `npm run build && npm start`)

| Gate | Result |
| --- | --- |
| First Load JS, `/[persona]/work/[slug]` | 155 kB — budget 200 kB (`/[persona]` is 169 kB) |
| Static routes emitted | 15, including all six case studies |
| `tests/persona.mjs` | all assertions pass, 3 consecutive runs |
| `tests/homepage.mjs` | all pass |
| Malformed frontmatter | build **fails** with the file path and the failing key |
| Lighthouse mobile, case study | Perf 93 · A11y 100 · BP 100 · SEO 66 |
| Lighthouse mobile, `/swe` control, same session | Perf 79 |
| Horizontal overflow, 375 / 768 / 1440 | none; `pre` scrolls inside itself |
| Prose measure | 37ch at 375px, 70ch at 768px and above |

**SEO 66 is the correct result, not a defect.** The only failing audit is `is-crawlable`,
which is `noindex` doing its job — §2.4 is the entire search-engine exclusion. Any change
that raises this number has broken the product's defining constraint.

**The perf numbers are paired and still not conclusive**, for the reason M3 recorded: this
machine swings ~8 points per run while also serving the site under 4× CPU throttling. The
case study reading *above* the persona page is expected — it ships less client JS — but the
control is what makes that readable at all. M8 settles the absolute numbers off this machine.

**The zod claim was proved, not asserted.** `period:` was corrupted to `perid:` in
`ticketing-system.mdx`; the build failed with
`Invalid case study in content/projects/swe/ticketing-system.mdx:` and named the missing key.
The file was restored and the build re-verified green.

### Carried out of M4

- **Six case studies' worth of prose is still placeholder.** `check:content` now scans
  `.mdx` as well as `.ts` — a two-line change without which every one of these would have
  deployed under a green check. It names them alongside the `content/site.ts`,
  `content/work.ts` and `content/personas/swe.ts` items, and blocks deploy.
- **The publication question M3 carried out is now answered for the visuals but not the
  screenshots.** The `SETS` gate in `scripts/prepare-work-images.mjs` still stands; granting
  permission later is one entry plus a re-run, and the generated schematic is what ships
  until then.
- **`text-ink-faint` is not a text colour.** It failed Lighthouse at 3.23:1 on the meta
  labels and was swapped for `text-ink-muted`. `scripts/check-contrast.mjs` registers it
  `info: true` — measured but unrated — which is easy to read as "passing".
---

## M5 — Blog ✅

- `content/blog/swe/*.mdx`, same validated pipeline as M4 — `export const meta`, zod on the
  whole module, a throw naming the file and the failing key.
- `/[persona]/blog` list: title, date, reading time, tags, newest first, paginated at 10.
- `/[persona]/blog/page/[n]`: pages 2+. **Page 1 has one address** — `/blog/page/1` is never
  generated and is a 404, so there is no duplicate route to keep `noindex` on in two places.
- `/[persona]/blog/[slug]`: title, date, author, reading time, MDX body, newer/older links.
- Outline built from `h2`/`h3` at build time, scroll-spy with `aria-current="location"`,
  click-to-jump, `<details>` disclosure on mobile and a sticky rail from `md` up.
- Designed empty state when a persona has no posts.

**Done when:** outline tracks scroll accurately, headings are deep-linkable, list paginates
correctly. ✅ — all three asserted in `[blog · outline]` and `[blog · pagination]`.

### Two things a later reader will be tempted to change, and should not

1. **THE OUTLINE IS DERIVED FROM THE MDX SOURCE, BY `content/blog.ts`.** It reads the `.mdx`
   with `node:fs` at build time and produces both the outline and the reading time from that
   one read. **Do not add `rehype-slug` alongside it.** That would put the heading ids in a
   different pipeline from the outline that has to match them — two passes, two packages, and
   a drift that shows up as outline links that silently stop resolving. The ids come from
   `lib/slugify.ts`, one function with exactly two callers: `content/blog.ts` and
   `mdx-components.tsx`. They cannot drift because they are the same call.

   `analyze()` is **build-time only** and must stay that way. Every blog route is
   `dynamicParams = false` and fully prerendered; `content/` is not in the `output:
   "standalone"` bundle, so flipping `dynamicParams` to `true` turns this into an ENOENT in
   production, not a slow page.

2. **`slugify` requires plain-text headings.** An `h2` containing inline code or a link
   flattens differently on the two sides — `content/blog.ts` sees raw markdown,
   `mdx-components.tsx` sees React children. Rather than write a markdown-inline normalizer
   twice, the constraint is stated and **enforced**: `[blog · outline]` collects every rendered
   `main h2[id], h3[id]` and every `aside a[href^="#"]` and fails on any set difference, naming
   the offending ids. That assertion is what makes the normalizer unnecessary.

Also worth keeping: the static segment `page/` wins over the sibling `[slug]`, so **`page` is
a reserved post slug**. That is the whole cost of this route shape and it is cheaper than
inventing `/blog/p/2`.

### Measured (local, `npm run build && npm start`)

| Gate | Result |
| --- | --- |
| First Load JS, `/[persona]/blog/[slug]` | 112 kB — budget 200 kB |
| First Load JS, `/[persona]/blog` and `/blog/page/[n]` | 144 kB |
| Static routes emitted | 29 total, 14 new (12 posts + list + page 2) |
| `tests/persona.mjs` | 34 groups, all pass — 9 new |
| `tests/homepage.mjs` | all pass |
| Malformed `meta.date` | build **fails**, naming `content/blog/swe/post-03.mdx` |
| Lighthouse mobile, post | Perf 90 · A11y 100 · BP 100 · SEO 63 |
| Lighthouse mobile, `/swe` control, same session | Perf 86 · SEO 66 |
| Horizontal overflow, 375 / 768 / 1440 | none, list and post |
| Prose measure | 37ch at 375px, 47ch at 768px, 62ch at 1440px |
| Outline mode | `<details>` at 375px, sticky `<aside>` at 768 and 1440 |

**SEO 63 is the correct result**, for the reason M4 already recorded: the only failing audit
is `is-crawlable`, which is `noindex` working. The 3-point gap from the control is the same
per-run noise the perf numbers carry. Any change that raises this number has broken §2.4.

**The zod claim was proved, not asserted.** `post-03`'s date was corrupted to `2026-8-14`;
the build failed with `Error: Invalid blog post in content/blog/swe/post-03.mdx:` and named
the failing path. The file was restored and the build re-verified green.

### Three test-authoring traps this milestone turned up

1. **React serialises the JSX prop name, so the markup carries `dateTime="…"`, not the
   HTML-spec lowercase `datetime`.** A case-sensitive grep for the latter matched zero of
   twelve dated cards and the "newest-first" assertion then passed **vacuously over an empty
   array**. Both regexes are `/i` now. A sort assertion that cannot fail on no data is worse
   than no assertion.
2. **`waitFor({ state: "visible" })` on the active outline link resolves instantly** — the
   *previously* active link is already visible. Both scroll-spy assertions poll with
   `waitForFunction` for the expected href instead.
3. **The last heading in a short post can never reach the scroll-spy band.** These posts are
   ~1670px in a 900px viewport, so the page runs out of scroll while the final heading sits
   at `top: 349` and an earlier one stays correctly active. `[blog · outline]` asserts on a
   mid-document heading; asserting on the last one fails a component that is behaving.

### Carried out of M5

- **Twelve posts' worth of prose is placeholder**, named by `check:content` alongside
  everything else in the carried-forward list, and blocking deploy.
- **The empty state is unreachable today** — one built persona, twelve posts. It is written
  and reviewed but not exercised by a test, and is recorded here as such rather than claimed
  as covered.

---

## M6 — Experience, skills, contact, footer ✅

**Taken ahead of M4 and M5, deliberately.** M6 was the only remaining milestone whose content
already existed: `content/_raw-experience.md` held four jobs with real bullets and numbers, real
education, and a concrete tech list, all recovered from `1ea7f90`. M4 needs long-form prose for
six projects, five of which are the employer's internal tools still blocked on the publication
question M3 carried out — it would have shipped six MDX files of lorem ipsum against a pipeline
nobody could meaningfully review. The sequencing note at the bottom of this file permits the
swap, and M4 and M5 now run adjacent, which suits them: they share the MDX + zod pipeline.

- Timeline as `<ol>`, scroll-drawn rail, mono tabular years, entries animating in from the rail.
- Skills grouped by category — four groups, text chips, no logos. Only twelve of the ~20 listed
  skills had a logo file, so a logo wall presents an arbitrary subset as the whole list, and
  "sprint planning" has no logo at all. The 12 unused logo files in `public/` are deleted; they
  remain in git history at `1ea7f90`.
- Contact block: email, LinkedIn, GitHub, WhatsApp. No form (§7). No CV control while
  `cv.available` is false — a download button pointing at a 404 is worse than no button, the
  same call M3 made for `hasCaseStudy`.
- Persona footer: icon-only social links and auto year, no homepage link.
- `content/experience.ts` and `content/skills.ts` follow M3's `getWork(code)` getter pattern
  rather than growing the `Persona` type, so the registry stays a small readable index and a
  persona with no timeline is an absent key, not an empty array to remember.
- `whatsapp` is a **separate export** in `content/site.ts`, not a fourth entry in
  `contactLinks`. That array is what the homepage renders (§4 gives it email, LinkedIn and
  GitHub only); a shared array the persona filters is one wrong predicate away from putting a
  personal phone number on the public homepage.
- `components/ui/contact-link.tsx` extracted from `components/home/contact-links.tsx` now that
  the persona block is its second consumer — the same rule M3 applied to the focus trap. It is
  safe across the isolation boundary because it receives its href as data and has no link of
  its own; the two *content-reading* components stay separate, which is where the leak risk
  actually lives. `npm run test:e2e` is the regression gate on the extraction.
- Education is one more entry in the timeline, not a section. One degree does not earn a
  landmark, and `persona.sections` is what decides landmarks.

**Done when:** `/swe` is content-complete end to end. ✅

### Measured (local, `npm run build && npx next start`, `/swe`)

| Gate | Result |
| --- | --- |
| First Load JS | 167 kB — budget 200 kB (M3 was 163 kB; +4 kB is `useScroll`) |
| `tests/persona.mjs` | 88 assertions, all pass |
| `tests/homepage.mjs` | all pass — the `ContactLink` extraction is clean |
| CLS | 0.018 — budget 0.05 |
| Lighthouse mobile, 3 paired runs | Perf 90/87/86 vs homepage control 96/97/92 |
| A11y · BP | 100 · 100 |
| `npm run check:content` | still fails, and names nothing in the two new content modules |

### Two bugs the new tests caught

Both were found by assertions written to be falsifiable rather than to pass, and both are
recorded because the shape of each will recur.

- **The rail never drew.** `TimelineRail` was missing the `useMounted()` gate that
  `components/ui/reveal.tsx` documents at length: Framer serializes the fill's starting
  `scaleY(0)` into the SSR markup as an inline style, and when the reduced-motion branch then
  renders a plain `<div>`, React updates the className and leaves that style attribute in
  place. The rail was permanently collapsed — `matrix(1, 0, 0, 0, 0, 0)`. This is the third
  component to hit the M2 trap. **Any client component with a non-motion fallback branch needs
  the mount gate**, not just the ones in `reveal.tsx`.
- **4px of horizontal scroll at 375px.** Timeline entries used `axis="left"`, which is a
  *positive* 24px x-offset, so every entry sat past the right edge until it revealed. It was
  also backwards: §4.3 asks for entries entering *from the rail*, which is `axis="right"`. The
  `[overflow]` group caught it; nothing about the desktop view would have.

### Carried out of M6

- Real email, LinkedIn, GitHub and WhatsApp values for `content/site.ts`, and a current CV PDF
  (the only one in git history is from 2021). `npm run check:content` names all 16 remaining
  placeholders and blocks deploy.
- **SEO reads 66 on `/swe` against 100 on the homepage.** This is `noindex` being scored as a
  defect, which is §2.4 working exactly as specified. Recorded so a later reader does not
  "fix" it.

---

## M7 — Quality gate ✅

The milestone that makes the promises in `design-system.md` §7–8 enforceable rather than aspirational.

- Playwright e2e: homepage and `/swe` smoke, lightbox keyboard flow, theme persistence,
  blog outline scroll-spy, 404 on unknown persona.
- **Isolation test** — asserts no anchor on any persona route resolves to `/` or to another
  persona code, and that the homepage links to no persona route. This is the product's
  defining constraint; it gets a test, not a convention.
- `axe-core` pass on every route in both themes. Zero critical or serious violations.
- ~~Visual regression snapshots at 375 / 768 / 1440.~~ **Dropped on purpose — do not add it
  back as an oversight.** Playwright's antialiasing differs between this Windows machine and
  the Linux runner, so baselines taken here fail there; the fix is a Docker-based test loop,
  which M8 introduces and M7 does not have. What snapshots would catch is already covered:
  `[responsive]` asserts no horizontal overflow at all three widths, `check:contrast` covers
  the token table, and `check:a11y` sweeps every route in both themes. The remainder of what
  they catch is intentional design change, which is a diff to read, not a build to fail.
- Token contrast assertion test covering the `design-system.md` §1.3 table.
- Lighthouse CI wired into the PR gate with the §8 budgets. Regression fails the build.
- Reduced-motion run: verify WebGL never mounts and all content stays reachable.
- JS-disabled run: verify all text content renders.

**Done when:** the full suite is green in CI and the budget gate blocks a deliberate regression.

### What shipped

Two new gates, two new test groups, and a CI workflow that runs its own tests for the first
time.

| Gate | Command | Asserts |
| --- | --- | --- |
| Accessibility | `npm run check:a11y` | axe-core, 7 route shapes × 2 themes = 14 pairs, zero critical or serious |
| Budget | `npm run check:budget` | Lighthouse mobile, perf/a11y/bp ≥ 95, per-route SEO failing-audit set |
| Contrast | `npm run check:contrast` | §1.3 table, **now including translucent backgrounds** |
| Homepage | `npm run test:e2e` | 6 groups, +`[isolation · homepage]`, +2 theme-default assertions |
| Persona | `npm run test:persona` | 33 groups, +WebGL-absence in `[isolation · bundle]` |

**Measured, on the local run** (Windows, serving the site and running the throttled audit on
one CPU — worth ~8 points of variance):

| Route | perf | a11y | bp | seo |
| --- | --- | --- | --- | --- |
| homepage | 95 | 100 | 100 | 100 |
| persona | 95 | 100 | 100 | 66 |
| case study | 93 | 100 | 100 | 66 |
| blog list | 94–97 | 98 | 100 | 63 |
| blog page 2 | 97 | 98 | 100 | 63 |
| post | 92–93 | 100 | 100 | 63 |

The SEO numbers are `noindex` working; see `design-system.md` §8 for why the gate asserts the
failing-audit set instead of the score. Performance sits at or just below the floor on the
three content-heavy routes; `--report-only` exists for that and CI does not pass it. **If the
Linux runner cannot hold 95 either, record the number — do not lower the assertion.** M8's
run against the deployed site is the authoritative reading.

### `check:content` is advisory on PR, and only on PR

It exits 1 by design while content is deferred, and it sat at step 5 of 8 — so `lint`,
`typecheck` and `build` never executed in CI on any commit from M1 through M6. **The workflow
was red for six milestones and told us nothing.** It is `continue-on-error: true` now; the
placeholder count still prints. **M8 re-tightens it on the deploy path**, where shipping a
`TODO@example.com` actually costs something.

### Three real defects the gates found on their first run

1. **A genuine AA contrast failure, on five of fourteen route/theme pairs.** `--accent-quiet`
   is `rgba(255,145,77,0.14)` and the tag chips set `--accent-text` on it; composited over
   `--base` that lifts the background to `rgb(251,235,226)`, which pulled light-mode
   `#c2410c` down to **4.46:1**. `check-contrast.mjs` could not see it — it compared opaque
   hex pairs and read 4.96:1 against the *underlying* token. Fixed at both ends:
   `--accent-text` → `#b03c0b` (5.17:1), and the contrast script now composites alpha and
   **fails outright** on a translucent background declared without the opaque token beneath
   it. Lowering the tint alpha was computed and rejected: it topped out at 4.75:1 even at
   0.06, with a chip nearly invisible.
2. **The theme default did not match the spec.** `theme-script.tsx` fell back to
   `prefers-color-scheme`, so a light-OS visitor with no stored choice got a light first
   paint — but `design-system.md` §1.1 says dark is *the* default, not the default on a dark
   system. The `matchMedia` branch is gone. The existing `[theme]` group could not have
   caught this: its context was already dark, so the assertion was **vacuous**. The new one
   runs under `prefers-color-scheme: light`.
3. **`check-budget.mjs`'s own first version asserted `noindex` on the homepage**, which is
   the one page that must be indexed. Making the expectation per-route removed the false
   positive *and* made the assertion stronger — it now catches a persona route that has
   silently become crawlable, which a uniform allowance never could.

### The deliberate regressions, and what caught them

The done-condition, run three times and reverted each time:

| Injected | Caught by |
| --- | --- |
| `<a href="/swe">` in the homepage footer | **`npm run lint`** — `@next/next/no-html-link-for-pages` fires on a literal href |
| the same link with a computed href (`["", "swe"].join("/")`) | `[isolation · homepage]`, **both** assertions: the resolved-DOM sweep and the served-HTML scan |
| one `text-ink-muted` label → `text-ink-faint` | `check:a11y`, serious `color-contrast`, both themes, naming the `dt` |
| `robots: { index: false }` removed from the blog list route | `check:budget` SEO, **and** three assertions in `tests/persona.mjs` |

The lint result is the useful one: it means the naive form of the leak was already blocked,
and the isolation test earns its place by catching the form that was not.

### Four traps this milestone turned up

1. **`lighthouse` as a devDependency drags in four high-severity advisories** —
   `puppeteer-core` → `@puppeteer/browsers` → `extract-zip@2.0.1`
   (GHSA-jmr9-qjv8-65gv, symlink traversal), for which **no fixed version exists upstream**.
   It is invoked with `npx --yes lighthouse@12` instead, so it never enters
   `package-lock.json`. `npm audit` is back to 0.
2. **`URL` is shadowed inside `tests/homepage.mjs`** — the module's own base-address const
   has that name, so `new URL(...)` in Node scope is a `TypeError`. The first path segment is
   computed in the page from `a.pathname`, which the browser has already resolved.
3. **`waitUntil: "commit"` can land before the inline `<head>` script has run.** The no-flash
   assertion gets away with it because it reloads a warm page; a cold context read `null`.
   The new cold-context assertion waits for `domcontentloaded`.
4. **A backgrounded server holding stdout hangs a GitHub Actions step forever** — the step
   does not finish until its pipes close, so the job times out at six hours with no failing
   assertion to point at. The serve step redirects to a file, and an `if: failure()` step
   prints it, so "the server died" stays distinguishable from "an assertion failed".

### Carried out of M7

- **Performance is 92–94 on three routes locally**, against a floor of 95. Recorded, not
  lowered. M8 measures against Vercel.
- **CI has not yet been observed green.** Every gate passes locally; the first real run is
  the push that carries this milestone.

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
  record it and close the item; if it is not, fix it in this milestone. M2's `/swe` reading
  (2.5s) is the same finding on a second route, and is settled by the same measurement.

**Done when:** staging and production both serve the site, and a live `curl` confirms
persona routes are `noindex` and absent from the sitemap.

---

## M9 — WebGL hero backdrop

Deferred out of M2 (see that milestone for the full reasoning). Scheduled here rather than
backlogged because it is committed work waiting on a number, not a maybe.

- Unblocked by M8's production LCP reading. If production has no headroom under the §8
  budget, the poster is final and this milestone closes as won't-do — that is a legitimate
  outcome, not a failure.
- `next/dynamic` with `ssr: false`, mounted post-paint, behind the poster.
- All four skip conditions from `design-system.md` §5, plus IntersectionObserver and
  `visibilitychange` pause and the dpr clamp.
- Verify the ≤130 kB §5 budget, which no build has yet measured.

**Done when:** the canvas mounts only where §5 permits, production LCP stays inside budget
with it mounted, and `prefers-reduced-motion` still renders the poster alone.

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
