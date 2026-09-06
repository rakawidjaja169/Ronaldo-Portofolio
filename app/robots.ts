import type { MetadataRoute } from "next"

import { env } from "@/lib/env"

/**
 * robots.txt — deliberately silent about persona paths.
 *
 * docs/product.md §2.4 originally called for `Disallow` on every persona code
 * alongside a noindex meta. That is wrong twice over:
 *
 *   1. robots.txt is public at a fixed, guessable URL. Listing the codes there
 *      publishes the complete persona enumeration to anyone who reads it —
 *      exactly the leak the isolation rule exists to prevent.
 *   2. Disallow blocks crawling, so a crawler never fetches the page and never
 *      reads its noindex. A URL discovered elsewhere can still be indexed as a
 *      bare link. Disallow and noindex cancel each other out.
 *
 * The per-page `robots: { index: false, follow: false }` on persona routes
 * (M2) does the whole job and leaks nothing. Do not add Disallow rules here.
 *
 * THE STAGING BRANCH BELOW IS THE ONE EXCEPTION, AND IT IS NOT A CONTRADICTION.
 * Everything above is about persona paths on the production origin, where
 * naming a code publishes the enumeration and Disallow would suppress the
 * noindex that does the real work. A staging origin has neither problem: the
 * blanket `Disallow: /` names nothing, and there is no indexing to preserve —
 * the whole point is that no part of staging should be crawled. Without it a
 * staging deploy publishes a crawlable duplicate of the homepage, which is
 * production's only indexable page, and the two compete for the same content.
 * Persona routes were never at risk either way; their noindex is per-page.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  }
}
