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
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  }
}
