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

The build now refuses rather than guessing: an `ARG` with no `--build-arg` expands to an
empty string, which is not nullish and so defeats the fallback instead of triggering it.
The Dockerfile checks for that before `npm run build` and stops in under a second with the
variable named. Without the check it failed forty seconds in, inside page-data collection,
as `ERR_INVALID_URL` with no mention of which variable was empty.

**A second consequence: staging is not crawlable.** `lib/env.ts` derives `isProduction`
from this same value — not from `NODE_ENV`, which cannot tell the two apart because
staging is a production build in every sense `NODE_ENV` means. `app/robots.ts` reads it and
serves a blanket `Disallow: /` on any non-production origin. Persona routes were never at
risk (their `noindex` is per-page), but the homepage is `Allow: /`, so without this a
staging deploy publishes a crawlable duplicate of production's only indexable page.
Verified by building both flavours: the staging image serves `Disallow: /`, the production
one serves `Allow: /` plus its `Sitemap:` line.

---

## 2. Production — Vercel

Free tier. No configuration file: `next.config.mjs` carries the security headers, and
Vercel honours `headers()` natively, so there is no `vercel.json` to keep in sync with
it.

1. **Import the repo.** Vercel → Add New → Project → import `Ronaldo-Portofolio`.
2. **Framework preset:** Next.js. Build command, output directory and install command
   are all correct by default — leave them.
3. **Node version:** 22. `package.json` declares `engines.node: "22.x"` and `.nvmrc`
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

   In Dokploy the field is **Environment tab -> Build Time Arguments** — not the Build tab,
   and not the regular Environment Variables box directly above it. It only appears once
   build type is Dockerfile. Regular env vars are never passed as `--build-arg`; they reach
   the final image only, which is too late for a `NEXT_PUBLIC_` value.
4. **Port:** `3000`. The container listens on `0.0.0.0:3000` (`ENV HOSTNAME=0.0.0.0` in
   the runner stage — without it Next binds localhost inside the container and the proxy
   gets connection-refused).
5. **Health check:** already in the image —
   `wget --spider -q http://127.0.0.1:3000/`, 30s interval, 10s start period. Dokploy
   reads it; nothing to configure.
6. **Deploy**, then run §4 against the staging origin.

Rebuilding staging is required whenever the staging origin changes, because of §1.

### The staging hostname must name the machine Traefik runs on

`sslip.io` encodes the IP **in the hostname**: `foo.192.168.0.22.sslip.io` resolves to
`192.168.0.22`, always, with no record to configure. That is the appeal, and it is also the
trap — Dokploy pre-fills the domain field with its own guess at the server's address, and
that guess is wrong on any box behind NAT or with more than one interface.

Point it at the host serving Traefik. Confirm which one that is before trusting the
pre-filled value:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' http://<ip>/   # Traefik: 404 for an unknown Host
curl -sSI http://<ip>/ | grep -i '^server:'                    # anything else: not Traefik
```

**A wrong IP fails as `curl: (52) Empty reply from server`** — the connection is accepted and
closed with no bytes, because something else on the network answers port 80 and has no route
for the name. That is indistinguishable from a crashed container, and it survives a rebuild,
so it reads as an app fault. It is not. Check the hostname's IP against Traefik's host first;
`docker logs` showing `✓ Ready` while every request returns 52 is the signature.

Two related notes, neither of them a fault:

- **`OCI runtime exec failed: "bash": executable file not found`** in the panel's terminal or
  log viewer is `node:22-alpine` shipping `ash`, not `bash`. The panel, not the app.
- **HSTS over plain HTTP** is inert — browsers ignore `Strict-Transport-Security` on a
  non-secure connection. `next.config.mjs` sends it unconditionally; leave it.


### Auto-deploy on push

Dokploy does not poll. It waits for a POST from GitHub, and until 2026-09-06 nothing was
sending one — the repo had no webhook at all, and the last two commits were on `staging`
while the app was configured for `main`.

Three things have to line up. Only the third is difficult.

1. **Content type `application/json`.** Not `x-www-form-urlencoded`. Dokploy reads `ref` and
   `repository.full_name` out of the JSON body; form-encoding hands it a single `payload=`
   string it never parses.
2. **The branch must match exactly.** Dokploy compares the payload's `ref` against
   `refs/heads/<its configured branch>` and answers `{"message":"Branch Not Match"}` on any
   difference. App -> General -> Branch, and the branch you actually push, are the two
   values.
3. **GitHub must be able to reach the panel**, and by default it cannot.

`dokploy.rakawidjaja.com` resolves publicly to `192.168.0.3` — an RFC 1918 address. It works
from the LAN and is unroutable from anywhere else, so every webhook delivery fails at the
connection, whatever the content type and branch say. This is the same private-IP-in-public-DNS
disclosure noted elsewhere; it is also the thing that breaks auto-deploy.

**A Cloudflare Tunnel is the fix**, and it needs no port forwarding, no public IP, and no
inbound firewall rule — `cloudflared` dials out and Cloudflare routes back down that
connection.

Expose a deploy endpoint, not the panel. One hostname reaching the Dokploy container is
enough for the webhook, and it keeps the login form off the public internet. Tunnelling
`dokploy.rakawidjaja.com` itself works too, but then the dashboard is public and wants
Cloudflare Access in front of it with a bypass rule carved out for the webhook path — more
surface and more configuration for the same result.

**In Cloudflare** (Zero Trust -> Networks -> Tunnels):

1. Create a tunnel, connector type `cloudflared`. Copy the token.
2. Add a public hostname:

   | Field | Value |
   | --- | --- |
   | Subdomain | `deploy` |
   | Domain | `rakawidjaja.com` |
   | Service type | `HTTP` |
   | URL | `host.docker.internal:3000` |

   **The origin URL depends on how `cloudflared` was installed**, and getting it wrong is
   the difference between a 200 and a 502:

   | Install | Origin URL |
   | --- | --- |
   | Plain `docker run` with `--add-host=host.docker.internal:host-gateway` (what is deployed) | `host.docker.internal:3000` |
   | Dokploy application, on Dokploy's own Docker network | `dokploy:3000` |
   | `cloudflared service install` on the host itself | `localhost:3000` |

   **A `deploy` DNS record must not already exist.** Adding the public hostname creates a
   CNAME to `<tunnel-uuid>.cfargotunnel.com`; a pre-existing A record wins and the name keeps
   resolving to the private address, which looks exactly like a tunnel that never came up.
   Delete the old record first.
3. SSL/TLS mode: **Full**. Not Flexible — it produces redirect loops against Traefik.

**The connector is already running** on the Dokploy VM (192.168.0.22), installed 2026-09-06 as
a plain container so it survives a Dokploy reinstall and does not depend on the panel it exists
to reach:

```sh
docker run -d --name cloudflared --restart=always \
  --add-host=host.docker.internal:host-gateway \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <token>
```

Four `Registered tunnel connection` lines (connIndex 0-3) is a healthy connector. `cloudflared-memora`
on the same host is a different tunnel for a different project — leave it alone.

**Reaching that VM.** It has no SSH key that this workstation holds, and its Docker socket is not
exposed. The way in is the Proxmox hypervisor at `192.168.0.10` (`pve`, key `id_ed25519_proxmox`),
where `dokploy` is **VMID 202** with the QEMU guest agent enabled:

```sh
ssh root@192.168.0.10 'qm guest exec 202 -- /bin/sh -c "<command>"'
```

That runs as root inside the VM and returns JSON with an `out-data` field. Use it for anything
the panel cannot do.

**In the app being deployed:** General -> Auto Deploy on, branch set to the branch you push.

**In GitHub** (Settings -> Webhooks -> Add webhook):

| Field | Value |
| --- | --- |
| Payload URL | `https://deploy.rakawidjaja.com/api/deploy/<the app's deploy token>` |
| Content type | `application/json` |
| SSL verification | Enabled |
| Events | Just the push event |

The deploy token is the path segment Dokploy shows in its own webhook URL. Treat it as a
credential — it is the only thing guarding the endpoint.

**Verify** without waiting for a push:

```sh
curl -sS -X POST https://deploy.rakawidjaja.com/api/deploy/<token> \
  -H 'Content-Type: application/json' -H 'X-GitHub-Event: push' \
  -d '{"ref":"refs/heads/<branch>","repository":{"full_name":"<owner>/<repo>"}}'
# {"message":"Application deployed successfully"}
```

Then push, and read GitHub's Recent Deliveries tab. A green 200 is the whole contract; a
red timeout means the tunnel is not up, and `Branch Not Match` means item 2 above.

**The staging origin does not change** unless you also route it through the tunnel. Doing so
would earn real HTTPS and retire the sslip.io hostname above, but it is a separate decision
with its own consequence: it puts staging on the public internet. `robots.txt` still serves
`Disallow: /` there, so it stays out of search results either way, and it would need a
rebuild — the origin is baked in at build time (§1) — with a value that is **not** the
production origin, or `isProduction` flips and staging starts advertising itself as
crawlable.

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
