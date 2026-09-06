import createMDX from "@next/mdx"

/**
 * `pageExtensions` is deliberately NOT extended to include mdx.
 *
 * Case-study MDX lives in content/projects/, is imported by
 * content/case-studies.ts, and is rendered by app/[persona]/work/[slug].
 * Adding "mdx" here would make any .mdx file under app/ a route of its own —
 * a second, unguarded way to publish a page, with no persona check, no
 * noindex, and no notFound(). docs/product.md §2 does not survive that.
 */
const withMDX = createMDX({})

/**
 * Response headers, applied to every route.
 *
 * next.config headers() is honoured by BOTH the standalone server and Vercel,
 * so one implementation covers both hosts and there is no vercel.json holding
 * a second copy to drift out of sync.
 *
 * script-src IS LISTED, AND IT IS 'unsafe-inline'. BOTH HALVES ARE DELIBERATE.
 *
 * Listing it is not optional. This CSP shipped once without a script-src at
 * all, on the assumption that an absent directive leaves scripts unrestricted.
 * It does the opposite: default-src is the fallback, so 'self' applied to
 * scripts and the browser blocked every inline one. The whole page went
 * non-interactive — the pre-paint theme script, Next's bootstrap, hydration.
 * Four assertions in tests/persona.mjs caught it; a human eye on the header
 * would not have.
 *
 * 'unsafe-inline' rather than a nonce or a hash, because the alternatives cost
 * more than the directive is worth on a static site with no user input:
 *
 *   - A nonce requires middleware, which forces dynamic rendering. That
 *     contradicts docs/product.md §10 ("everything is statically generated")
 *     and spends the very Lighthouse performance this milestone is defending.
 *   - Hashes keep static output, but Next's inline bootstrap hash changes
 *     between builds — so the site breaks on the next framework upgrade, with
 *     a blank page and a console error as the only symptom.
 *
 * Be honest about what that leaves: script-src 'unsafe-inline' is not XSS
 * protection. The value of this CSP is the other directives — object-src
 * 'none', base-uri 'self', frame-ancestors 'none', form-action 'self' — which
 * are real, independent of script-src, and cost nothing to maintain. A site
 * that renders only its own MDX and has no form posting anywhere is not the
 * place to buy script-src with a rendering-mode change.
 *
 * style-src needs 'unsafe-inline' too, because Framer Motion writes inline
 * styles. tests/persona.mjs asserts every header on a live response, so none
 * of this can regress unnoticed — which is exactly how the bug above surfaced.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ")

const SECURITY_HEADERS = [
  /* Two years, preload-eligible. Only meaningful over HTTPS; harmless on localhost. */
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* Redundant with frame-ancestors for modern browsers; kept for old ones. */
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: CSP },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dokploy (Docker) needs standalone output; Vercel ignores it.
  output: "standalone",
  reactStrictMode: true,
  // No X-Powered-By: Next. Free version disclosure, zero benefit.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }]
  },
}

export default withMDX(nextConfig)
