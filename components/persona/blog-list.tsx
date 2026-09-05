import { ArrowLeft } from "lucide-react"

import { BlogCard } from "@/components/persona/blog-card"
import { Paginator } from "@/components/persona/paginator"
import { RevealGroup, RevealItem } from "@/components/ui/reveal"
import type { PostSummary } from "@/content/blog"

/**
 * The post list, shared by /[persona]/blog and /[persona]/blog/page/[n] — one
 * body, so page 1 and page 2 cannot drift apart in layout or in metadata.
 *
 * Server component. `RevealGroup`/`RevealItem` are the client boundary and
 * they already carry the M2 `useMounted()` gate, so the cards themselves ship
 * with the document and read with JS off.
 *
 * IT OWNS THE HEADER TOO, so the two routes that use it are thin wrappers
 * differing only in which page they ask for. A heading rendered per-route
 * would drift the moment one of them was edited.
 *
 * An `<ol>`, not a `<ul>`: the order is the content — newest first — and the
 * paginator only makes sense against an ordered sequence.
 */
export function BlogList({
  posts,
  page,
  pageCount,
  basePath,
  personaPath,
}: {
  posts: readonly PostSummary[]
  page: number
  pageCount: number
  /** `/swe/blog` — post hrefs and the paginator hang off this. */
  basePath: string
  /** `/swe` — the one way out, and it stays inside the persona (§2.1). */
  personaPath: string
}) {
  return (
    <div className="mx-auto max-w-page px-inset pt-32 pb-section">
      {/*
        The only navigation out, persona-relative by construction — never "/",
        never another code (§2.1, §2.3). Before the heading so a keyboard user
        reaches it first, matching the case-study page.
      */}
      <a
        href={personaPath}
        className="inline-flex min-h-11 items-center gap-2 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:text-accent"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        Back to portfolio
      </a>

      <h1 className="mt-6 font-display text-display-l font-semibold">Writing</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-muted">
        Notes on the parts of building software that only show up once it is running.
      </p>

      {posts.length === 0 ? (
        /*
          DESIGNED EMPTY STATE — the work-grid.tsx visual, reused deliberately
          so the two empty states in the site are recognisably the same object.

          Unreachable today: one built persona, twelve posts. It exists because
          the first persona added without posts would otherwise render a heading
          over nothing, and that is a defect found in production rather than
          here.
        */
        <div className="mt-12 rounded-md border border-border bg-surface p-10 text-center">
          <p className="font-display text-h3 font-semibold">No posts yet</p>
          <p className="mt-2 text-body-s text-ink-muted">
            Writing lands here when there is something worth saying twice.
          </p>
        </div>
      ) : (
        <>
          <RevealGroup as="ol" className="mt-12 flex flex-col">
            {posts.map((post) => (
              <RevealItem as="li" key={post.slug}>
                <BlogCard post={post} basePath={basePath} />
              </RevealItem>
            ))}
          </RevealGroup>

          <Paginator page={page} pageCount={pageCount} basePath={basePath} />
        </>
      )}
    </div>
  )
}
