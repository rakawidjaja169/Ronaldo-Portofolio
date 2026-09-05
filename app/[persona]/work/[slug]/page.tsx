import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Github } from "lucide-react"

import { CaseStudyGallery } from "@/components/persona/case-study-gallery"
import { Reveal } from "@/components/ui/reveal"
import { getCaseStudy, getCaseStudySlugs } from "@/content/case-studies"
import { BUILT_PERSONAS, getPersona, isPersonaCode } from "@/content/personas"
import { getWork } from "@/content/work"

/**
 * Case study — docs/product.md §5.2.
 *
 * NONE OF THE ISOLATION GUARANTEES ARE INHERITED HERE, and that is the single
 * trap in this file. `generateMetadata` inherits from the parent *layout*, and
 * app/[persona]/layout.tsx exports no metadata at all — the robots and
 * canonical values live in app/[persona]/page.tsx, which is a sibling, not an
 * ancestor. Everything below is restated in full for that reason. Deleting any
 * of it makes this route indexable while /swe stays clean, which is exactly
 * the failure §2.4 is written against.
 *
 * Nothing in this file names a persona (§9.5).
 */

/*
  §2.6, restated: an unknown slug is a 404, never a redirect. Without this line
  a slug outside generateStaticParams renders on demand, and the 404 becomes a
  server round-trip that also confirms the route shape.
*/
export const dynamicParams = false

/**
 * RETURNS BOTH SEGMENTS, not just `slug`, and the `params` argument is
 * deliberately unused. A nested generateStaticParams is only handed its
 * parent's params when an ANCESTOR generates them — that means the parent
 * *layout*, and app/[persona]/layout.tsx exports none. The
 * generateStaticParams in app/[persona]/page.tsx is a sibling, so it does not
 * feed this: the argument arrives as `{}` and every slug is silently dropped.
 * The build still passes, with zero case-study routes emitted, which is why
 * this is worth a paragraph.
 *
 * Adding one to the layout instead would put a third copy of the persona list
 * in the tree. Producing the cross product here keeps the enumeration in the
 * one place that already owns it.
 */
export function generateStaticParams() {
  return BUILT_PERSONAS.flatMap((persona) =>
    getCaseStudySlugs(persona).map((slug) => ({ persona, slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string; slug: string }>
}): Promise<Metadata> {
  const { persona: code, slug } = await params
  if (!isPersonaCode(code)) return {}
  const study = await getCaseStudy(code, slug)
  if (!study) return {}

  return {
    title: study.meta.title,
    description: study.meta.summary,
    /* §2.4 — restated, not inherited. See the file docblock. */
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ persona: string; slug: string }>
}) {
  const { persona: code, slug } = await params
  if (!isPersonaCode(code)) notFound()

  const persona = getPersona(code)
  if (!persona) notFound()

  const study = await getCaseStudy(persona.code, slug)
  if (!study) notFound()

  const { meta, Body } = study
  /*
    Images come from content/work.ts rather than from the frontmatter: the card
    and the case study must show the same set, and two lists would drift. A
    slug with no work item is not an error here — the study still reads, it
    just has no gallery.
  */
  const images = getWork(persona.code).find((item) => item.slug === slug)?.images ?? []

  const links = [
    meta.links.live ? { href: meta.links.live, label: "Live site", Icon: ExternalLink } : null,
    meta.links.repo ? { href: meta.links.repo, label: "Source", Icon: Github } : null,
  ].filter((link) => link !== null)

  return (
    <article className="mx-auto max-w-page px-inset pt-32 pb-section">
      {/*
        The only navigation out, and it is persona-relative by construction —
        never "/", never another code (§2.1, §2.3). It sits before the heading
        so a keyboard user reaches it first, without a skip link of its own.
      */}
      <a
        href={`/${persona.code}#work`}
        className="inline-flex min-h-11 items-center gap-2 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:text-accent"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        All work
      </a>

      <header className="mt-6 border-b border-border pb-12">
        <h1 className="font-display text-display-l font-semibold">{meta.title}</h1>
        <p className="mt-6 max-w-[65ch] text-body-l text-ink-muted">{meta.summary}</p>

        {/*
          A definition list, not a row of divs: role and period are labelled
          values, and dt/dd is what says so to a screen reader. Tabular figures
          on the period so the digits do not shift the label beside them.

          ink-muted ON THE LABELS, NOT ink-faint. scripts/check-contrast.mjs
          registers ink-faint as `info: true` — measured but unrated, because
          it is a hairline value rather than a text colour. At text-meta (12px)
          on --surface it lands at 3.23:1 and Lighthouse fails it outright. The
          muted token is the smallest step that clears 4.5:1 while keeping the
          label subordinate to its value.
        */}
        <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4 font-mono text-meta uppercase">
          <div>
            <dt className="text-ink-muted">Role</dt>
            <dd className="mt-1 text-ink">{meta.role}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Period</dt>
            <dd className="mt-1 tabular-nums text-ink">{meta.period}</dd>
          </div>
        </dl>

        {/*
          Plain list items, matching components/persona/skill-groups.tsx: these
          are labels, and a 44px target that does nothing when pressed is a §7
          defect.
        */}
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Stack">
          {meta.stack.map((tech) => (
            <li
              key={tech}
              className="inline-flex items-center rounded-sm bg-accent-quiet px-3 py-1.5 font-mono text-meta uppercase text-accent-text"
            >
              {tech}
            </li>
          ))}
        </ul>

        {links.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-3">
            {links.map(({ href, label, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-4 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:border-border-strong hover:text-ink active:scale-97"
                >
                  <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {/*
        65ch measure, §2.2. The cap is on this wrapper rather than on each
        element so a `pre` or an image inside the body is bounded by the same
        column and cannot widen the page.
      */}
      <div className="max-w-[65ch]">
        <Body />
      </div>

      {images.length > 0 ? (
        <section className="mt-16 border-t border-border pt-12">
          <Reveal>
            <h2 className="font-display text-h2">Gallery</h2>
          </Reveal>
          <CaseStudyGallery images={images} title={meta.title} />
        </section>
      ) : null}
    </article>
  )
}
