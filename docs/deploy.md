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
sending one.

**Why this is hard here and trivial on Vercel.** The difference is not that Dokploy is worse
designed. It is which side opens the connection:

| | Vercel | Dokploy |
| --- | --- | --- |
| Where it runs | Vercel's public cloud | A VM on the LAN, `192.168.0.22` |
| Public inbound address | Permanent, theirs | **None.** Double-NAT (Fiber -> ZTE -> TP-Link), no port forwarding |
| How it hears about a push | GitHub **App** — grant repo access once, GitHub pushes to an address that is always reachable | GitHub **webhook** — GitHub must POST *into* the house |

Vercel felt like "just allow the repo" because the hard part, being reachable, was already
true. Every option for fixing Dokploy is really an answer to *how does an event from the
public internet reach a machine with no public address* — and it would be identical for
Coolify, CapRover, or a bare compose box. Self-hosting buys control and costs reachability.

Three things must line up. Only the third is difficult.

1. **Content type `application/json`.** Not `x-www-form-urlencoded`. Dokploy reads `ref` and
   `repository.full_name` out of the JSON body; form-encoding hands it a single `payload=`
   string it never parses.
2. **The branch must match exactly.** Dokploy compares the payload's `ref` against
   `refs/heads/<its configured branch>` and answers `{"message":"Branch Not Match"}` on any
   difference. App -> General -> Branch, and the branch you actually push, are the two values.
3. **GitHub must be able to reach the panel**, and by default it cannot.

#### The DNS finding that looks like a bug and is not

`deploy.rakawidjaja.com` resolves to `192.168.0.3`. So does `dokploy.rakawidjaja.com`,
`portfolio.rakawidjaja.com`, and `zzz-nonexistent-test.rakawidjaja.com` — because
**`*.rakawidjaja.com` is a wildcard A record** pointing there. `192.168.0.3` is CT101
`proxy`, running nginx-proxy-manager with 22 LAN-only vhosts. It is correct as it is.

Two consequences worth writing down, because both cost time once:

- **There is no stale record to delete** before adding a tunnel hostname. Cloudflare writes a
  specific proxied CNAME, and a specific record beats a wildcard. Nothing to clean up first.
- **The wildcard publishes an RFC 1918 address to the world.** Minor information disclosure,
  pre-dates this project, unchanged here — but it is also why every webhook delivery failed
  at the connection regardless of content type or branch.

#### The fix: a Cloudflare Tunnel, gated by Access

Outbound-only. `cloudflared` dials out and Cloudflare routes back down that connection — no
port forwarding, no public IP, no inbound firewall rule.

Expose a deploy endpoint, not the panel. One hostname reaching the Dokploy container is
enough for the webhook, and it keeps the dashboard off the public internet.

**The connector is already running** on vm202 as `cloudflared-portfolio`, matching the house
pattern used by `cloudflared-memora`, `cloudflared-9router` and the Vaultwarden tunnel — one
dedicated container per service, on `dokploy-network`, Access in front:

```sh
docker run -d --name cloudflared-portfolio --restart=always \
  --network dokploy-network \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <token>
```

Four `Registered tunnel connection` lines (connIndex 0-3) is a healthy connector. Being on
`dokploy-network` is what lets it resolve `dokploy` and `dokploy-traefik` by name; a container
on the default bridge cannot, and needs `--add-host=host.docker.internal:host-gateway` plus
`host.docker.internal:3000` instead. That works, but it is off-pattern — prefer the network.

`cloudflared-memora` on the same host is a different tunnel for a different project. Leave it.

**In Cloudflare** (Zero Trust -> Networks -> Tunnels), add a public hostname:

| Field | Value |
| --- | --- |
| Subdomain | `deploy` |
| Domain | `rakawidjaja.com` |
| Service type | `HTTP` |
| URL | `dokploy:3000` |

SSL/TLS mode: **Full**. Not Flexible — it produces redirect loops against Traefik.

**Then gate it** (Zero Trust -> Access -> Applications). Access cannot authenticate GitHub —
a webhook cannot complete an email OTP — so the deploy path is unavoidably open, and the
policy order is what contains it:

| Order | Path | Policy |
| --- | --- | --- |
| 1 | `/api/deploy/*` | **Bypass** — Everyone |
| 2 | `/*` | **Allow** — your email, one-time PIN |

Everything except the token-guarded deploy endpoint is behind OTP. A leaked deploy token then
buys an attacker exactly one thing: triggering a staging rebuild of a public repo. Rotate it
from the Dokploy app's webhook URL; it is the only credential guarding that path.

**In the app being deployed:** General -> Auto Deploy on, branch set to the branch you push.

**In GitHub** (Settings -> Webhooks -> Add webhook):

| Field | Value |
| --- | --- |
| Payload URL | `https://deploy.rakawidjaja.com/api/deploy/<the app's deploy token>` |
| Content type | `application/json` |
| SSL verification | Enabled |
| Events | Just the push event |

**Verify** without waiting for a push:

```sh
curl -sS -X POST https://deploy.rakawidjaja.com/api/deploy/<token> \
  -H 'Content-Type: application/json' -H 'X-GitHub-Event: push' \
  -d '{"ref":"refs/heads/<branch>","repository":{"full_name":"<owner>/<repo>"}}'
# {"message":"Application deployed successfully"}
```

Then push, and read GitHub's Recent Deliveries tab. A green 200 is the whole contract; a red
timeout means the tunnel is not up, and `Branch Not Match` means item 2 above.

#### Reaching vm202

The key is `vm202_id_ed25519` in `D:/Documents/Raka/HomeServer/docs/secrets/`, per that
repo's `secrets/README.md`:

```sh
ssh -i D:/Documents/Raka/HomeServer/docs/secrets/vm202_id_ed25519 root@192.168.0.22
```

If that key is ever lost, the hypervisor is the way back in: `192.168.0.10` (`pve`, key
`proxmox_id_ed25519`) has `dokploy` as **VMID 202** with the QEMU guest agent enabled, so
`qm guest exec 202 -- /bin/sh -c "<command>"` runs as root inside the VM and returns JSON with
an `out-data` field. Slower and clumsier than SSH; useful exactly once.

### Naming a staging hostname

`portfolio-staging.rakawidjaja.com` — **one label deep, and project-scoped.**

Both halves are constraints, not taste:

- **One label.** Cloudflare Universal SSL on the free plan covers `rakawidjaja.com` and
  `*.rakawidjaja.com` and nothing deeper — verified from the served certificate's SANs.
  `portfolio.staging.rakawidjaja.com` is two levels and would fail TLS verification for every
  visitor; multi-level wildcards need paid Advanced Certificate Manager.
- **Project first, not environment first.** `staging.rakawidjaja.com` claims the whole
  namespace for whichever project got there first. `<project>-staging` scales —
  `memora-staging`, `bookorbit-staging` — and sorts by project, which is how these are
  actually thought about.

**Using it requires a rebuild**, because of §1: the origin is baked in at build time. Pass
`NEXT_PUBLIC_SITE_URL=https://portfolio-staging.rakawidjaja.com` as a build argument. It must
**not** be the production origin, or `isProduction` flips and staging starts serving `Allow: /`
to crawlers. Route it through the tunnel with a second public hostname pointing at
`dokploy-traefik:80` (so Traefik keeps doing Host-based routing), set the app's domain to match
in Dokploy, and leave Dokploy's own HTTPS/Let's Encrypt off — Cloudflare terminates TLS at the
edge and internal traffic stays HTTP. Put an Access policy in front of it too: staging is not
for the public, and `robots.txt` alone only stops well-behaved crawlers.

Until that rebuild happens, staging stays at `portfolio-web.192.168.0.22.sslip.io`, LAN-only,
plain HTTP.

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
