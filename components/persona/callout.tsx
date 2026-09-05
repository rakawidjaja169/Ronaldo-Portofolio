import { type ReactNode } from "react"

/**
 * Pull-quote / constraint callout — docs/design-system.md §2.2.
 *
 * The MDX `blockquote` maps to this, which is the only reason it exists: a
 * case study needs one place to park the constraint a reader would otherwise
 * ask about halfway down, and `>` is the notation the author already has.
 *
 * A `<blockquote>` element, not a styled div, because that is what the source
 * says it is — the accent rule is presentation on top of real semantics.
 *
 * NOT a `<figure>`/`<cite>` pair. These are the author's own words about their
 * own work, so there is nobody to attribute; adding a citation slot would
 * invite filling it with the project name and claiming a quote that was never
 * said.
 */
export function Callout({ children }: { children: ReactNode }) {
  return (
    /*
      The child selectors override the MDX `p` mapping, which sets `mt-5` and
      `text-ink-muted` for body prose. Inside the callout the first paragraph
      must not carry a top margin on top of the block's own padding, and muted
      grey on the accent-quiet fill loses the contrast the emphasis is for.
    */
    <blockquote className="my-10 rounded-r-md border-l-2 border-accent bg-accent-quiet py-5 pr-6 pl-6 text-body-l [&>p]:mt-0 [&>p]:text-ink [&>p+p]:mt-4">
      {children}
    </blockquote>
  )
}
