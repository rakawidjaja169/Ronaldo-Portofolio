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

export const env = {
  /** Canonical origin. Used for metadata, OG URLs, sitemap. */
  siteUrl: process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://portfolio.rakawidjaja.com",
} as const
