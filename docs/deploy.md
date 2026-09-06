# Deploy

Two hosts, one codebase. Vercel serves production at `portfolio.rakawidjaja.com`;
Dokploy serves staging from the Docker image in `Dockerfile`. Nothing here needs a
database, a runtime secret, or a build-time secret — every route is prerendered.

Read §1 before touching either host. It is the one thing about this repo that is
silently wrong rather than loudly broken.

---

## 1. The one trap: `NEXT_PUBLIC_SITE_URL` is baked in at build time

`lib/env.ts` reads it, and `app/layout.tsx`, `app/sitemap.ts` and `app/robots.ts`
consume it — `metadataBase`, the OpenGraph `url`, the single `sitemap.xml` entry, and
the `Sitemap:` line in `robots.txt`.

Because the prefix is `NEXT_PUBLIC_`, **the value is inlined into the bundle by
`next build`**. Setting it at `docker run` time changes nothing; the built artifact
already contains whatever was present when it was built. **One image serves exactly one
origin.**

`lib/env.ts` falls back to `https://portfolio.rakawidjaja.com` when the variable is
absent, which makes the failure quiet:

| Host | If you omit it | What ships |
| --- | --- | --- |
| Vercel (production) | Fallback applies | Correct — this is the production origin |
| Dokploy (staging) | Fallback applies | **Wrong.** Staging serves production canonicals, a production `sitemap.xml`, and production OG URLs to every crawler that reaches it |

So Vercel needs no environment variable at all, and **staging must pass the value as a
Docker build argument** — not as a runtime env var. See §3.

---

## 2. Production — Vercel

Free tier. No configuration file: `next.config.mjs` carries the security headers, and
Vercel honours `headers()` natively, so there is no `vercel.json` to keep in sync with
it.

1. **Import the repo.** Vercel → Add New → Project → import `Ronaldo-Portofolio`.
2. **Framework preset:** Next.js. Build command, output directory and install command
   are all correct by default — leave them.
3. **Node version:** 22. `package.json` declares `engines.node: ">=22"` and `.nvmrc`
   says `22`; confirm the project setting agrees rather than trusting the platform
   default, which moves.
4. **Environment variables: none.** Adding `NEXT_PUBLIC_SITE_URL` is harmless if it
   matches the production origin, and actively wrong if it does not. The fallback in
   `lib/env.ts` already is the production origin.
5. **Deploy**, then confirm the preview URL renders before attaching the domain.
6. **Custom domain:** Project → Settings → Domains → add `portfolio.rakawidjaja.com`.
   Vercel then shows the exact record to create. It is normally:

   | Type | Name | Value |
   | --- | --- | --- |
   | `CNAME` | `portfolio` | `cname.vercel-dns.com` |

   Create it at the registrar holding `rakawidjaja.com`. **Use whatever value Vercel
   displays**, not the one above, if the two differ — that value changes over time and
   this table is a description, not a source of truth.
7. **HTTPS** is issued automatically once DNS resolves. Do not enable HSTS preload at
   the registrar or in Cloudflare as well; `next.config.mjs` already sends
   `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

`output: "standalone"` in `next.config.mjs` is for Docker. Vercel ignores it.

---

## 3. Staging — Dokploy

1. **New Application** → source: this Git repository, branch `main`.
2. **Build type:** Dockerfile. The repo root `Dockerfile` is a three-stage build on
   `node:22-alpine` that runs as the non-root `node` user.
3. **Build argument — required, and the whole of §1:**

   ```
   NEXT_PUBLIC_SITE_URL=https://<the staging origin Dokploy gives you>
   ```

   A **build argument**, not an environment variable. Dokploy's UI has separate fields
   for the two; putting it in the wrong one produces an image that builds cleanly and
   serves production URLs.
4. **Port:** `3000`. The container listens on `0.0.0.0:3000` (`ENV HOSTNAME=0.0.0.0` in
   the runner stage — without it Next binds localhost inside the container and the proxy
   gets connection-refused).
5. **Health check:** already in the image —
   `wget --spider -q http://127.0.0.1:3000/`, 30s interval, 10s start period. Dokploy
   reads it; nothing to configure.
6. **Deploy**, then run §4 against the staging origin.

Rebuilding staging is required whenever the staging origin changes, because of §1.

---

## 4. Post-deploy verification

Every check below is a command. Run them against whichever origin you just deployed.

```sh
BASE_URL=https://portfolio.rakawidjaja.com npm run test:persona
```

This is the M8 done-condition, not a smoke test. It asserts, on the live response:
`robots.txt` carries no `Disallow` and names no persona code; `sitemap.xml` contains no
persona path; the persona routes send `noindex` with a null canonical; no anchor
resolves to the homepage or another persona; no shipped client chunk contains a reserved
code; and every security header from `next.config.mjs` is present with the right value.

```sh
BASE_URL=https://portfolio.rakawidjaja.com npm run test:e2e
BASE_URL=https://portfolio.rakawidjaja.com npm run check:a11y
BASE_URL=https://portfolio.rakawidjaja.com npm run check:budget
```

`check:budget` against **production** is the authoritative §8 performance reading. The
local numbers and the CI numbers both measure a machine that is not the one serving the
site; see `docs/roadmap.md` M8 for what the open homepage LCP finding is and what
production is meant to settle.

```sh
curl -sI https://portfolio.rakawidjaja.com
```

A second read of the headers that does not depend on this repo's own test — worth doing
once per host, because a CDN or proxy in front of the origin can strip or add headers
that `headers()` knows nothing about.

---

## 5. Pre-flight: content

```sh
npm run check:content
```

**Must exit 0 before a production deploy is considered real.**

This gate is `continue-on-error: true` in `.github/workflows/ci.yml` while content is
deliberately deferred, so CI will not stop a deploy that ships a `TODO` email address, a
placeholder LinkedIn URL, or lorem case-study prose. Until the content milestone lands
and re-tightens it in CI, this line is the only thing standing between a placeholder and
production. Run it by hand.

---

## 6. Rollback

**Vercel:** Deployments → the last known-good deployment → Promote to Production.
Instant; no rebuild. Vercel keeps every previous build.

**Dokploy:** redeploy the previous image tag, or redeploy from the previous commit. If
the staging origin changed since that commit, remember §1 — the older image has the
older origin baked into it.
