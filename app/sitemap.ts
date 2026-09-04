import type { MetadataRoute } from "next"

import { env } from "@/lib/env"

/**
 * Sitemap — the homepage only.
 *
 * docs/product.md §2.5. This must never derive entries from PERSONA_CODES:
 * a sitemap is public, and one enumerated entry undoes the isolation rule.
 * The literal single entry is the point, not an oversight.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
