import { type Metadata } from "next"
import { notFound } from "next/navigation"

import { Hero } from "@/components/persona/hero"
import { Section } from "@/components/persona/section"
import { BUILT_PERSONAS, getPersona, isPersonaCode } from "@/content/personas"

/**
 * Persona page — docs/product.md §5.1.
 *
 * Adding persona #2 is a content file plus a registry line. Nothing in this
 * file names a persona (criterion §9.5).
 */

/*
  Only built codes are prerendered, and `dynamicParams = false` makes anything
  else a 404 without ever invoking this component.

  This is the §2.6 mechanism: /xyz returns 404, NOT a redirect to /. A redirect
  would confirm that valid codes exist and reward probing, which is the one
  behavior the isolation rule cannot afford.
*/
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
  const persona = isPersonaCode(code) ? getPersona(code) : undefined
  if (!persona) return {}

  return {
    title: persona.meta.title,
    description: persona.meta.description,
    /*
      The entire search-engine exclusion, per §2.4. robots.txt stays silent on
      persona paths and must never be changed: it is public at a fixed URL, so
      listing the codes there publishes the enumeration this rule exists to
      hide, and a Disallow would stop the crawl before the crawler ever read
      this noindex.
    */
    robots: { index: false, follow: false },
    /* Same reason — a persona URL must not be shareable into an index. */
    alternates: { canonical: null },
  }
}

export default async function PersonaPage({ params }: { params: Promise<{ persona: string }> }) {
  const { persona: code } = await params
  if (!isPersonaCode(code)) notFound()

  const persona = getPersona(code)
  if (!persona) notFound()

  return (
    <>
      <Hero persona={persona} />

      {/*
        Section landmarks and headings ship now with empty bodies. The nav
        scroll-spy and the hero CTA both address these ids, so they have to be
        real from the first commit or those controls are decorative. Bodies
        land in M3 (work), M4 (case studies), and M6 (experience, skills,
        contact) without touching the nav or the hero.
      */}
      {persona.sections.map((section) => (
        <Section key={section.id} id={section.id} heading={section.heading} />
      ))}
    </>
  )
}
