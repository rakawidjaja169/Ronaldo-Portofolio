import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { BlogOutline } from "@/components/persona/blog-outline"
import { getPost, getPostSlugs } from "@/content/blog"
import { BUILT_PERSONAS, getPersona, isPersonaCode } from "@/content/personas"
import { formatPostDate } from "@/lib/format-date"

/**
 * One post — docs/product.md §5.3.
 *
 * NONE OF THE ISOLATION GUARANTEES ARE INHERITED HERE. `generateMetadata`
 * inherits from the parent *layout*, and app/[persona]/layout.tsx exports no
 * metadata; everything below is restated in full for that reason. Deleting any
 * of it makes this route indexable while /swe stays clean, which is exactly the
 * failure §2.4 is written against.
 *
 * PREV/NEXT ARE SAME-PERSONA BY CONSTRUCTION (§2.3): content/blog.ts only ever
 * reads one code's loader map, so there is no cross-persona neighbour available
 * to emit by mistake.
 *
 * Nothing in this file names a persona (§9.5).
 */

export const dynamicParams = false

/**
 * RETURNS BOTH SEGMENTS — see the same note on the work case study. A nested
 * generateStaticParams is fed only by an ancestor *layout*, and this tree has
 * none that generates params, so `{ slug }` alone emits zero routes on a build
 * that still passes.
 */
export async function generateStaticParams() {
  const params = await Promise.all(
    BUILT_PERSONAS.map(async (persona) => {
      const slugs = await getPostSlugs(persona)
      return slugs.map((slug) => ({ persona, slug }))
    }),
  )
  return params.flat()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string; slug: string }>
}): Promise<Metadata> {
  const { persona: code, slug } = await params
  if (!isPersonaCode(code)) return {}
  const post = await getPost(code, slug)
  if (!post) return {}

  return {
    title: post.meta.title,
    description: post.meta.summary,
    /* §2.4 — restated, not inherited. See the file docblock. */
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ persona: string; slug: string }>
}) {
  const { persona: code, slug } = await params
  if (!isPersonaCode(code)) notFound()

  const persona = getPersona(code)
  if (!persona) notFound()

  const post = await getPost(persona.code, slug)
  if (!post) notFound()

  const { meta, Body, toc, readingMinutes, newer, older } = post
  const blogPath = `/${persona.code}/blog`

  return (
    <div className="mx-auto max-w-page px-inset pt-32 pb-section">
      {/*
        The only navigation out, persona-relative by construction — never "/",
        never another code (§2.1, §2.3). Before the heading so a keyboard user
        reaches it first, without a skip link of its own.
      */}
      <a
        href={blogPath}
        className="inline-flex min-h-11 items-center gap-2 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:text-accent"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        All posts
      </a>

      <header className="mt-6 border-b border-border pb-12">
        <h1 className="font-display text-display-l font-semibold">{meta.title}</h1>
        <p className="mt-6 max-w-[65ch] text-body-l text-ink-muted">{meta.summary}</p>

        {/*
          ink-muted on the labels, NOT ink-faint: scripts/check-contrast.mjs
          registers ink-faint `info: true` — measured but unrated — and at
          text-meta it lands at 3.23:1, which Lighthouse fails outright.

          `<time>` needs no tabular-nums class; app/globals.css:193 gives the
          element `font-variant-numeric: tabular-nums` in @layer base.
        */}
        <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4 font-mono text-meta uppercase">
          <div>
            <dt className="text-ink-muted">Published</dt>
            <dd className="mt-1 text-ink">
              <time dateTime={meta.date}>{formatPostDate(meta.date)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Author</dt>
            <dd className="mt-1 text-ink">{meta.author}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Read</dt>
            <dd className="mt-1 tabular-nums text-ink">{readingMinutes} min</dd>
          </div>
        </dl>

        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
          {meta.tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center rounded-sm bg-accent-quiet px-3 py-1.5 font-mono text-meta uppercase text-accent-text"
            >
              {tag}
            </li>
          ))}
        </ul>
      </header>

      {/*
        Prose first in the DOM, outline second, and the outline is pulled back
        up on desktop with `order`. That way a screen reader and a keyboard user
        meet the article before a list of links into it, while a sighted desktop
        reader still sees the rail on the left. On mobile the outline's own
        `<details>` renders above the prose, which is the order it wants there.

        `min-w-0` on the article: without it a `pre` inside the MDX body sets the
        grid column's min-content width to its longest line and widens the page,
        which is the §5 horizontal-scroll failure the 375px pass looks for.
      */}
      <div className="mt-12 gap-12 md:grid md:grid-cols-[minmax(0,1fr)_14rem]">
        <article className="min-w-0 max-w-[65ch]">
          <Body />
        </article>

        <div className="md:order-first md:col-start-2 md:row-start-1">
          <BlogOutline toc={toc} />
        </div>
      </div>

      {newer || older ? (
        <nav
          aria-label="More posts"
          className="mt-16 grid gap-4 border-t border-border pt-12 sm:grid-cols-2"
        >
          {newer ? (
            <a
              href={`${blogPath}/${newer.slug}`}
              rel="prev"
              className="group rounded-md border border-border p-5 transition-colors duration-150 hover:border-border-strong"
            >
              <span className="inline-flex items-center gap-2 font-mono text-meta uppercase text-ink-muted">
                <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
                Newer
              </span>
              <span className="mt-2 block font-display text-h3 font-semibold transition-colors duration-150 group-hover:text-accent">
                {newer.title}
              </span>
            </a>
          ) : (
            <span aria-hidden="true" />
          )}

          {older ? (
            <a
              href={`${blogPath}/${older.slug}`}
              rel="next"
              className="group rounded-md border border-border p-5 transition-colors duration-150 hover:border-border-strong sm:text-right"
            >
              <span className="inline-flex items-center gap-2 font-mono text-meta uppercase text-ink-muted">
                Older
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="mt-2 block font-display text-h3 font-semibold transition-colors duration-150 group-hover:text-accent">
                {older.title}
              </span>
            </a>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}
