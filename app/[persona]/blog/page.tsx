import { type Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogList } from "@/components/persona/blog-list"
import { getPageCount, getPostPage } from "@/content/blog"
import { BUILT_PERSONAS, getPersona, isPersonaCode } from "@/content/personas"

/**
 * Post list, page 1 — docs/product.md §5.3.
 *
 * NOTHING BELOW IS INHERITED. `generateMetadata` inherits from the parent
 * *layout*, and app/[persona]/layout.tsx exports no metadata at all: the robots
 * and canonical values on app/[persona]/page.tsx are a sibling's, not an
 * ancestor's. A green isolation check on /swe proves nothing about this route,
 * which is the M4 trap restated where it recurs.
 *
 * ONE ADDRESS FOR PAGE 1. This route is it; /blog/page/1 is deliberately never
 * generated, and Paginator links here for page 1.
 *
 * Nothing in this file names a persona (§9.5).
 */

/* §2.6, restated: an unknown persona is a 404, never a redirect. */
export const dynamicParams = false

export function generateStaticParams() {
  return BUILT_PERSONAS.map((persona) => ({ persona }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string }>
}): Promise<Metadata> {
  const { persona: code } = await params
  if (!isPersonaCode(code)) return {}
  const persona = getPersona(code)
  if (!persona) return {}

  return {
    title: "Writing",
    description: `Notes and posts by ${persona.role}.`,
    /* §2.4 — restated, not inherited. See the file docblock. */
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  }
}

export default async function BlogIndexPage({ params }: { params: Promise<{ persona: string }> }) {
  const { persona: code } = await params
  if (!isPersonaCode(code)) notFound()

  const persona = getPersona(code)
  if (!persona) notFound()

  const [posts, pageCount] = await Promise.all([
    getPostPage(persona.code, 1),
    getPageCount(persona.code),
  ])

  return (
    <BlogList
      posts={posts}
      page={1}
      pageCount={pageCount}
      basePath={`/${persona.code}/blog`}
      personaPath={`/${persona.code}`}
    />
  )
}
