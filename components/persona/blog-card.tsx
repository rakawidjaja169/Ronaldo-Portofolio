import type { PostSummary } from "@/content/blog"
import { formatPostDate } from "@/lib/format-date"

/**
 * One row in the post list — docs/product.md §5.3.
 *
 * Server component. The list has no interactive state, so nothing here is
 * "use client" and the whole page reads with JS disabled.
 *
 * ONE LINK PER CARD, spread over the card by the `after:absolute after:inset-0`
 * overlay already used in project-card.tsx. Tags are plain `li`s, not filters:
 * there is no tag route, and a 44px target that does nothing is a §7 defect.
 *
 * `text-ink-muted` on the meta line, never `text-ink-faint` — that token is
 * registered `info: true` in scripts/check-contrast.mjs (measured but unrated,
 * because it is a hairline value), and at text-meta it reads 3.23:1 and fails
 * Lighthouse outright. This is the M4 finding, restated where it recurs.
 *
 * `<time>` carries no `tabular-nums` class: app/globals.css:193 already gives
 * the element `font-variant-numeric: tabular-nums` in @layer base.
 */
export function BlogCard({ post, basePath }: { post: PostSummary; basePath: string }) {
  const { slug, meta, readingMinutes } = post

  return (
    <article className="group relative border-b border-border py-8 transition-colors duration-300 hover:border-border-strong">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-meta uppercase text-ink-muted">
        <time dateTime={meta.date}>{formatPostDate(meta.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{readingMinutes} min read</span>
      </div>

      <h3 className="mt-3 font-display text-h2 font-semibold">
        {/*
          Persona-relative by construction — the caller passes `/swe/blog` and
          this concatenates. Never "/" and never another code (§2.1, §2.3).
        */}
        <a
          href={`${basePath}/${slug}`}
          className="transition-colors duration-150 after:absolute after:inset-0 after:content-[''] group-hover:text-accent"
        >
          {meta.title}
        </a>
      </h3>

      <p className="mt-3 max-w-[65ch] text-body-l text-ink-muted">{meta.summary}</p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {meta.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-sm bg-accent-quiet px-2 py-1 font-mono text-meta uppercase text-accent-text"
          >
            {tag}
          </li>
        ))}
      </ul>
    </article>
  )
}
