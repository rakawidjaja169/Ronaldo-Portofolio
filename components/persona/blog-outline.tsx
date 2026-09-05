"use client"

import { useEffect, useState } from "react"

import type { TocEntry } from "@/content/blog"
import { cn } from "@/lib/utils"

/**
 * Post outline with scroll-spy — docs/roadmap.md M5.
 *
 * TAKES ONLY ITS ENTRIES. No persona code, no import of content/personas.ts —
 * the rule stated in the components/persona/nav.tsx docblock, and the reason
 * the [blog · bundle] test greps the shipped chunks for the reserved codes.
 *
 * NO FRAMER HERE, ON PURPOSE. The M2 trap: a motion component serialises its
 * `initial` into the SSR markup as an inline `opacity:0`, and when a non-motion
 * fallback branch renders instead, React leaves that style in place and the
 * content never appears. This component has exactly the branchy shape that
 * triggers it, so it renders plain markup and `Reveal` wraps it from outside if
 * an entrance is wanted.
 *
 * THE SAME LIST TWICE — a native `<details>` on mobile, a sticky `<aside>` on
 * desktop, both fed by the one observer. `<details>` because the disclosure is
 * then free, keyboard-operable, and open/closable with JS disabled. CSS cannot
 * reliably force a closed `<details>` open at a breakpoint, so duplicating a
 * handful of links is the cheaper defect.
 *
 * The ids it links to come from lib/slugify.ts, which mdx-components.tsx also
 * calls when it sets them on the rendered headings — one function, so a link
 * and its heading cannot disagree. [blog · outline] asserts that set equality.
 */
export function BlogOutline({ toc }: { toc: readonly TocEntry[] }) {
  const [active, setActive] = useState<string | null>(null)

  /*
    Deliberately the same observer configuration as the nav scroll-spy: the
    band is the top quarter of the viewport, and the first document-ordered
    match wins so the choice stays deterministic when two short sections are
    both inside it. Two spies that behave *nearly* identically would be worse
    than either, so this is a copy rather than a variation.
  */
  useEffect(() => {
    const els = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = els.find((el) => visible.has(el.id))
        setActive(first ? first.id : null)
      },
      { rootMargin: "0px 0px -75% 0px" },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  const links = (
    <ul className="flex flex-col gap-1">
      {toc.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            aria-current={active === entry.id ? "location" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center text-body-s transition-colors duration-150",
              entry.depth === 3 && "ps-4",
              active === entry.id ? "text-accent" : "text-ink-muted hover:text-ink",
            )}
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <details className="mb-10 rounded-md border border-border bg-surface px-5 py-3 md:hidden">
        <summary className="min-h-11 cursor-pointer list-none font-mono text-meta uppercase text-ink-muted marker:content-['']">
          Contents
        </summary>
        <div className="pb-2">{links}</div>
      </details>

      {/*
        `top-28` clears the 88px nav plus a little air, matching the
        `scroll-mt-24` the headings carry so a deep link and the sticky rail
        agree about where the top of the page is.
      */}
      <aside className="sticky top-28 hidden self-start md:block" aria-label="Contents">
        <p className="font-mono text-meta uppercase text-ink-muted">Contents</p>
        <div className="mt-2 border-l border-border ps-4">{links}</div>
      </aside>
    </>
  )
}
