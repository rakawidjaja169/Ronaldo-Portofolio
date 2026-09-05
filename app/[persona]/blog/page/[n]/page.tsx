import { type Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogList } from "@/components/persona/blog-list"
import { getPageCount, getPostPage } from "@/content/blog"
import { BUILT_PERSONAS, getPersona, isPersonaCode } from "@/content/personas"

/**
 * Post list, page 2+ — docs/product.md §5.3.
 *
 * THE STATIC SEGMENT `page/` WINS OVER THE SIBLING `[slug]`, so `page` is a
 * reserved post slug. That is the whole cost of this route shape, and it is
 * cheaper than inventing /blog/p/2 to avoid a collision with a word nobody is
 * going to title a post.
 *
 * `n` starts at 2. Page 1 lives at /[persona]/blog and is not generated here,
 * so /blog/page/1 is a 404 — one address per page, and no duplicate route to
 * keep `noindex` in two places.
 *
 * The metadata and dynamicParams notes on app/[persona]/blog/page.tsx apply
 * here in full and are restated below rather than inherited.
 */

export const dynamicParams = false

/**
 * RETURNS BOTH SEGMENTS. A nested generateStaticParams is only handed its
 * parent's params when an ANCESTOR generates them — meaning the parent
 * *layout*, and app/[persona]/layout.tsx exports none. Returning `{ n }` alone
 * silently emits zero routes and the build still passes green.
 */
export async function generateStaticParams() {
  const pages = await Promise.all(
    BUILT_PERSONAS.map(async (persona) => {
      const pageCount = await getPageCount(persona)
      return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
        persona,
        n: String(i + 2),
      }))
    }),
  )
  return pages.flat()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string; n: string }>
}): Promise<Metadata> {
  const { persona: code, n } = await params
  if (!isPersonaCode(code)) return {}
  const persona = getPersona(code)
  if (!persona) return {}

  return {
    title: `Writing — page ${n}`,
    description: `Notes and posts by ${persona.role}.`,
    /* §2.4 — restated, not inherited. */
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  }
}

export default async function BlogPagePage({
  params,
}: {
  params: Promise<{ persona: string; n: string }>
}) {
  const { persona: code, n } = await params
  if (!isPersonaCode(code)) notFound()

  const persona = getPersona(code)
  if (!persona) notFound()

  /*
    Out of range is unreachable — the params are generated and dynamicParams is
    false — but the guard stays: it is what makes the invariant readable, and
    it is one comparison against a number this function already has.
  */
  const page = Number(n)
  const pageCount = await getPageCount(persona.code)
  if (!Number.isInteger(page) || page < 2 || page > pageCount) notFound()

  const posts = await getPostPage(persona.code, page)

  return (
    <BlogList
      posts={posts}
      page={page}
      pageCount={pageCount}
      basePath={`/${persona.code}/blog`}
      personaPath={`/${persona.code}`}
    />
  )
}
