/**
 * Environment validation.
 *
 * The site is fully static and currently needs no environment variables to
 * build or boot. This module exists so the first variable that IS needed fails
 * loudly and by name at startup, rather than surfacing as an undefined crash
 * three layers deep.
 *
 * When adding a variable: declare it here AND in .env.example, in the same change.
 */

const REQUIRED: readonly string[] = []

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. See .env.example.`,
    )
  }
}

validateEnv()

const PRODUCTION_ORIGIN = "https://portfolio.rakawidjaja.com"

/**
 * An empty string is an absent value, not a value.
 *
 * `??` does not treat "" as nullish, and a Docker `ARG` declared without a
 * `--build-arg` expands to exactly "" — so the naive `process.env.X ?? DEFAULT`
 * yielded "" and `new URL("")` threw `ERR_INVALID_URL` deep inside page-data
 * collection, with no mention of the variable that caused it. The Dockerfile
 * now refuses that build up front with a readable message; this is the second
 * line of defence, and the one that matters if the variable ever arrives empty
 * from somewhere with no such guard.
 */
const read = (key: string): string | undefined => {
  const value = process.env[key]
  return value !== undefined && value.trim() !== "" ? value : undefined
}

export const env = {
  /** Canonical origin. Used for metadata, OG URLs, sitemap. */
  siteUrl: read("NEXT_PUBLIC_SITE_URL") ?? PRODUCTION_ORIGIN,

  /**
   * Whether this build is the production one.
   *
   * DERIVED FROM siteUrl, NOT FROM NODE_ENV. Staging is a production build in
   * every sense NODE_ENV cares about — `next build`, minified, NODE_ENV
   * "production" — so NODE_ENV cannot tell the two apart and would mark the
   * Dokploy box as production. The origin can, because NEXT_PUBLIC_SITE_URL is
   * exactly the thing that differs between the two deployments.
   *
   * app/robots.ts is the consumer: staging must not be crawlable. Persona
   * routes carry their own per-page noindex and were never at risk, but the
   * homepage is `Allow: /`, so without this a staging deploy publishes a
   * crawlable duplicate of production's only indexable page.
   *
   * Like siteUrl, this is fixed at build time. A staging image cannot be
   * promoted to production by changing an env var; rebuild it.
   */
  isProduction: (read("NEXT_PUBLIC_SITE_URL") ?? PRODUCTION_ORIGIN) === PRODUCTION_ORIGIN,
} as const
