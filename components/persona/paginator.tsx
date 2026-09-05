import { ArrowLeft, ArrowRight } from "lucide-react"

/**
 * Blog pagination — docs/product.md §5.3 ("paginated at 10").
 *
 * Server component: plain anchors, no state, works with JS disabled. That is
 * also why there is no page-number row — a twelve-post blog has two pages, and
 * prev/next plus a position readout is the whole requirement without inventing
 * a component that has to decide when to ellipsize.
 *
 * PAGE 1 HAS ONE ADDRESS. `/blog/page/1` is deliberately not generated, so the
 * link back to the first page is `basePath` itself. Two URLs for one page would
 * be a duplicate route that also has to be kept `noindex` in two places.
 */
export function Paginator({
  page,
  pageCount,
  basePath,
}: {
  page: number
  pageCount: number
  basePath: string
}) {
  if (pageCount <= 1) return null

  const href = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`)

  return (
    <nav aria-label="Blog pages" className="mt-12 flex items-center justify-between gap-4">
      {page > 1 ? (
        <a
          href={href(page - 1)}
          rel="prev"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-4 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:border-border-strong hover:text-ink active:scale-97"
        >
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          Newer
        </a>
      ) : (
        /* A placeholder, not a disabled link: it keeps "Older" on the right
           edge at page 1 instead of letting the row collapse leftwards. */
        <span aria-hidden="true" />
      )}

      <p className="font-mono text-meta uppercase text-ink-muted" aria-current="page">
        Page {page} of {pageCount}
      </p>

      {page < pageCount ? (
        <a
          href={href(page + 1)}
          rel="next"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-4 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:border-border-strong hover:text-ink active:scale-97"
        >
          Older
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  )
}
