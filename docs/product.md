# Product — portfolio.rakawidjaja.com

## 1. What this is

A multi-persona personal portfolio. One codebase serves a neutral **homepage** plus
N **persona portfolios**, each addressed by a short path segment.

| Surface | URL | Purpose |
| --- | --- | --- |
| Homepage | `portfolio.rakawidjaja.com` | Neutral identity card. Anyone who trims the URL lands here. |
| Software Engineer | `portfolio.rakawidjaja.com/swe` | Shared with engineering recruiters. **Built in v1.** |
| Consultant | `/cst` | Reserved code. Not built. |
| Content Creator | `/cc` | Reserved code. Not built. |
| Product Manager | `/pm` | Reserved code. Not built. |
| Designer | `/dsn` | Reserved code. Not built. |

No database. All content is files in the repo, rendered at build time.

## 2. The isolation rule

This is the product's defining constraint. Get it wrong and the whole point is lost.

**A visitor given `/swe` must never learn that `/cst`, `/cc`, or `/pm` exist.**

Enforced by:

1. **No outbound links from a persona page to the homepage.** The persona nav logo scrolls
   to top (`#top`), it does not `href="/"`. No breadcrumb, no "back home", no footer home link.
2. **No links from the homepage to any persona page.** The homepage never enumerates personas.
3. **No cross-persona links, ever.** No persona switcher, no "see my other work" module.
4. **Search engines are excluded from persona paths.** `robots.txt` disallows every persona
   route; each persona page emits `<meta name="robots" content="noindex, nofollow">`.
   The homepage is indexable.
5. **No sitemap entry for persona routes.** `sitemap.xml` lists the homepage only.
6. **Unknown persona codes 404.** `/xyz` returns Next's `notFound()` — it does not redirect
   to the homepage, because a redirect would confirm that valid codes exist and reward probing.

Trimming `/swe` off the URL lands on the homepage. That is intended and safe: the homepage
reveals nothing.

### What this is not

This is obscurity, not security. Anyone who reads the JS bundle or guesses a two-letter code
can reach another persona. That is an accepted tradeoff — the content is public professional
material, not a secret. The goal is that a recruiter following the link you gave them sees
exactly one framing of you, not a menu.

## 3. Persona codes

Role initials, lowercase, 2–3 characters.

```
swe   Software Engineer
cst   Consultant
cc    Content Creator
pm    Product Manager
dsn   Designer
```

Chosen because they read as intentional in a shared link (`/swe` looks like a normal section,
not a tracking code) while carrying no obvious enumeration pattern. Codes are stable once
shared — a live link must never break.

## 4. Homepage

Deliberately minimal. It must look finished, not like a stub, while giving away nothing.

- Name, one-line positioning statement
- Portrait or abstract 3D mark
- Contact links: email, LinkedIn, GitHub
- CV download
- Footer: copyright, auto-year

Layout is visually distinct from persona pages so the two never read as the same template.
Its own route group, its own nav component, its own hero treatment.

**Not on the homepage:** project lists, role framing, persona links, blog.

## 5. Persona page (v1 scope — `/swe`)

Single scrolling page plus two nested routes.

### 5.1 `/swe` — main page

| Section | Contents |
| --- | --- |
| Hero | Name, role headline, short positioning line, primary CTA. Lazy WebGL backdrop. |
| Selected work | Filterable grid of project cards. Image, title, one-line outcome, tag list. Click → case study. Images open in a lightbox. |
| Experience | Scroll-animated career timeline. Company, role, dates, 2–3 outcome bullets. |
| Skills | Grouped competency blocks (languages, runtime, infra, practices). |
| Contact | Direct links only. Email, LinkedIn, GitHub, WhatsApp, CV download. |
| Footer | Social links, copyright with `new Date().getFullYear()`. No homepage link. |

Nav is anchor-based within the page, plus a link to `/swe/blog`.

### 5.2 `/swe/work/[slug]` — case study

Long-form MDX per project: problem, approach, architecture, outcome, stack, gallery,
optional live/repo links. Gallery images open in the same lightbox component.

### 5.3 `/swe/blog` and `/swe/blog/[slug]`

- **List**: title, date, reading time, tags. Newest first. Paginated at 10 posts.
- **Post**: MDX body with a sticky outline sidebar built from `h2`/`h3`, scroll-spy
  highlighting the active heading, click-to-jump. Shows title, publish date, author,
  reading time. Prev/next post links (within the same persona only).

## 6. Content model

No database. Content is typed TypeScript for structured data, MDX for prose.

```
content/
  personas.ts              registry: code → Persona, the single source of truth
  personas/
    swe.ts                 typed Persona object
  projects/
    swe/<slug>.mdx         case studies, frontmatter + body
  blog/
    swe/<slug>.mdx         posts, frontmatter + body
```

A `Persona` type makes a missing field a compile error rather than a blank section in
production. Adding a persona later is one content file plus one registry line — no route
changes, because `[persona]/` derives `generateStaticParams` from the registry.

MDX frontmatter is validated with zod at build time. A malformed post fails the build
instead of shipping broken.

### Blog authoring

Write MDX in any editor; git is the version history. Headings become the outline
automatically. A local WYSIWYG studio that emits MDX is a possible later addition and is
explicitly out of v1 scope.

## 7. Contact

Direct links only — no form, no API route, no secrets, no rate limiting to maintain.
Behaves identically on Vercel free tier and on Dokploy. Recruiters email.

Revisit only if link-only contact demonstrably costs an opportunity.

## 8. Non-goals for v1

- Any database or CMS
- Contact form / backend API routes
- Auth, analytics dashboards, comments
- Personas other than `swe`
- i18n
- WYSIWYG editor

## 9. Success criteria

1. `/swe` is shareable and contains zero paths to the homepage or any other persona.
2. Lighthouse ≥ 95 on all four categories, mobile, on the deployed build.
3. LCP < 2.0s on mobile 4G; initial JS < 200KB gzipped.
4. Fully keyboard navigable; axe reports zero critical violations.
5. Adding persona #2 requires no changes to routing or layout code.
6. Site renders correctly with JavaScript disabled for all text content.
7. `prefers-reduced-motion: reduce` disables WebGL and all non-essential motion.

## 10. Hosting

| Environment | Host | Notes |
| --- | --- | --- |
| Staging | Dokploy | Docker, `output: "standalone"`, multi-stage build. |
| Production | Vercel free tier | `portfolio.rakawidjaja.com`. Static output, no serverless functions needed. |

Everything is statically generated. No runtime environment variables are required to boot;
any that are added must be validated in `lib/env.ts` and documented in `.env.example`.
