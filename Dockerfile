# syntax=docker/dockerfile:1
#
# Staging image for Dokploy — docs/roadmap.md M8, docs/product.md §10.
#
# next.config.mjs sets output: "standalone", which emits a self-contained
# server.js plus only the node_modules it actually traced. That output is NOT
# complete on its own: .next/static and public/ are excluded and must be copied
# in beside server.js, which is the whole reason CI runs `npx next start`
# instead (.github/workflows/ci.yml) and why this file is the first thing in
# the repo to exercise the standalone path at all.

# ---------------------------------------------------------------------------
# deps — install once, cached on the lockfile alone
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# package.json + lockfile only: any other source change would bust this layer
# and re-run a two-minute install for a one-line copy edit.
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# builder
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# THIS MUST BE A BUILD ARG, NOT A RUNTIME ENV, AND THAT IS NOT A STYLE CHOICE.
#
# NEXT_PUBLIC_ variables are inlined into the bundle by `next build`. The value
# is baked into metadataBase, the OG url, sitemap.xml and the robots.txt
# sitemap line at THIS step — passing it to `docker run` later changes nothing.
# One image therefore serves exactly one origin.
#
# Omitting it is silently wrong rather than broken: lib/env.ts falls back to
# https://portfolio.rakawidjaja.com, so a staging container would serve
# production canonicals and a production sitemap to every crawler that reached
# it. Dokploy must pass --build-arg NEXT_PUBLIC_SITE_URL=<staging origin>.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Refuse the build rather than produce a wrong image. An ARG with no
# --build-arg expands to "", which is not nullish, so it defeats the fallback
# in lib/env.ts rather than triggering it — the first version of this file
# failed 40 seconds into `next build` with `ERR_INVALID_URL` and no mention of
# which variable was empty. Fail here instead, by name, in under a second.
RUN test -n "$NEXT_PUBLIC_SITE_URL" || ( \
      echo "" && \
      echo "NEXT_PUBLIC_SITE_URL is empty." && \
      echo "Pass it as a BUILD ARG, not a runtime env — it is inlined at build time:" && \
      echo "  docker build --build-arg NEXT_PUBLIC_SITE_URL=https://<origin> ." && \
      echo "See docs/deploy.md section 1." && \
      echo "" && \
      exit 1 )

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# runner
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# node:alpine ships a `node` user (uid 1000) already — no adduser needed.
# Ownership is set on copy so the running user never needs write access to
# anything it did not bring with it.
USER node

# The three-part copy the standalone output requires. server.js and its traced
# node_modules come from .next/standalone; the other two are excluded from it
# by design and are what a missing copy costs you: every hashed chunk and every
# image 404s while the HTML still renders, so the page loads unstyled rather
# than failing outright.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3000

# `/` is prerendered and static, so this is a real readiness signal with no
# health route to maintain. wget is busybox's, already in the image.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3   CMD wget --spider -q http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
