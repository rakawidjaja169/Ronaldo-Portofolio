import Image from "next/image"
import { Expand } from "lucide-react"

import type { WorkItem } from "@/content/work"

/**
 * Project card — docs/design-system.md §6 (`ProjectCard`), §4.3 (hover).
 *
 * TWO SEPARATE CONTROLS, which is the whole point of §6's note: the card links
 * to the case study, and the lightbox trigger is its own labelled button. If
 * the trigger lived inside the link, opening the gallery would be a click on
 * the link — nested interactive content, and a keyboard user reaching the
 * gallery would have no way to reach the case study.
 *
 * `hasCaseStudy` is false everywhere in M3 because M4 owns the case-study
 * route. A card linking to a 404 is worse than one that does not link yet, so
 * the title renders as plain text and the gallery button is the only control.
 *
 * Server component. The grid above it is client-side (filter state); this is
 * rendered as children into it, so the markup ships with the document and the
 * cards are readable with JS off.
 */
export function ProjectCard({
  item,
  personaCode,
  onOpen,
}: {
  item: WorkItem
  personaCode: string
  /** Rendered by the grid, which owns lightbox state. Receives the button so
   *  the grid can read its rect for the grow-from animation and hand focus
   *  back to it on close. */
  onOpen?: (trigger: HTMLButtonElement) => void
}) {
  const cover = item.images[0]

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface transition-[transform,border-color,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:border-border-strong hover:shadow-elev-2">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {cover ? (
          <Image
            src={cover.thumb}
            alt={cover.alt}
            fill
            /* §8: every below-fold image is lazy, without exception. */
            loading="lazy"
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 90vw"
            className="object-cover object-top transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
          />
        ) : null}

        {onOpen && item.images.length > 0 ? (
          <button
            type="button"
            onClick={(e) => onOpen(e.currentTarget)}
            aria-label={`View screenshots of ${item.title}`}
            /* z-10 clears the card link's ::after overlay, which is later in the DOM. */
            className="absolute right-3 bottom-3 z-10 inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface/90 text-ink-muted backdrop-blur-sm transition-colors duration-150 hover:bg-surface hover:text-ink active:scale-97"
          >
            <Expand size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-h3 font-semibold">
            {item.hasCaseStudy ? (
              /*
                Relative to the persona, never absolute. The isolation assertion
                in tests/persona.mjs resolves every href against the origin, and
                a path that climbed out of /[persona] would fail it.
              */
              <a
                href={`/${personaCode}/work/${item.slug}`}
                className="after:absolute after:inset-0 after:content-['']"
              >
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </h3>
          <span className="shrink-0 font-mono text-meta tabular-nums text-ink-faint">
            {item.year}
          </span>
        </div>

        <p className="flex-1 text-body-s text-ink-muted">{item.outcome}</p>

        <ul className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-sm bg-accent-quiet px-2 py-1 font-mono text-meta uppercase text-accent-text"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
