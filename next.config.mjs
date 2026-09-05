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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dokploy (Docker) needs standalone output; Vercel ignores it.
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
}

export default withMDX(nextConfig)
