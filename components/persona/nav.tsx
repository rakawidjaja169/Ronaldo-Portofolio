"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { useFocusTrap } from "@/lib/use-focus-trap"
import { cn } from "@/lib/utils"

type NavSection = { id: string; label: string }

type Props = {
  sections: readonly NavSection[]
  /**
   * Prefix for the section anchors. Empty on the persona page itself, where
   * `#work` is a same-document fragment and the browser scrolls in place.
   * `/swe` on a case study, where a bare `#work` would resolve inside the
   * case study and go nowhere.
   *
   * A PATH, NOT A PERSONA CODE, deliberately. This component still never
   * imports content/personas.ts and still cannot enumerate the codes — it
   * receives one string and concatenates it, exactly as it already receives
   * its sections. The [isolation · links] group resolves every href against
   * the origin, so a value that climbed out of the persona would fail there.
   */
  basePath?: string
  /**
   * `/swe/blog`, when the persona has posts. ANOTHER PLAIN STRING, exactly as
   * `basePath` is — still no persona code as a code, still no registry import.
   *
   * Not a `sections` entry: `PersonaSection.id` is both the scroll-spy key and
   * a real section landmark on the page, so a fake entry would put the blog
   * into the observer's element list and into `persona.sections.map` on the
   * page. This is a page link, not an anchor, which is also why the "no bare
   * fragment" assertion (it filters on `h.includes("#")`) does not cover it —
   * `[isolation · links]` resolves every href and does.
   */
  blogHref?: string
}

/**
 * Persona nav — docs/design-system.md §6, §4.3.
 *
 * Takes its sections as props and never imports content/personas.ts. That
 * import would pull the full PERSONA_CODES list into a client chunk and
 * publish the enumeration docs/product.md §2 exists to prevent. The isolation
 * assertion in tests/persona.mjs greps the shipped chunks for exactly that.
 *
 * The logo is a button that scrolls to top, not `href="/"` (§2.1). There is no
 * path out of a persona page.
 *
 * Markup is server-rendered, so the bar and its links paint with the document
 * and remain usable with JS disabled — anchors work without a runtime. The
 * client code adds condense, scroll-spy, and the mobile sheet, all of which
 * degrade to "a plain nav bar" if hydration never happens.
 *
 * DOCUMENTED EXCEPTION to §4.2 (never animate height): §4.3 specifies this
 * 88→64 condense by name. It is safe here specifically because the bar is
 * `fixed` with no in-flow siblings — the transition costs a paint, not a
 * document reflow, and the page below carries constant top padding, so CLS
 * stays 0. Do not copy this to an in-flow element.
 */
export function PersonaNav({ sections, basePath = "", blogHref }: Props) {
  const [condensed, setCondensed] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  /* Condense past 80px. rAF-throttled — §8 requires it of scroll handlers. */
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setCondensed(window.scrollY > 80)
        frame = 0
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /*
    Scroll-spy. The observer band is the top quarter of the viewport, so a
    section becomes active as its heading reaches reading position rather than
    when its last pixel leaves — which is what makes the highlight track the
    eye instead of the scrollbar.

    Taking the first document-ordered match keeps the choice deterministic when
    two short sections are both inside the band.
  */
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
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
  }, [sections])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  /*
    Sheet: Esc closes, focus is trapped, body scroll is locked — §7, plus the
    §9 rule that a modal always has an escape route.

    The trap itself lives in lib/use-focus-trap.ts as of M3, when the lightbox
    became its second consumer. Focus RETURN stays here, in `close`, because
    this component owns the trigger.
  */
  useFocusTrap({ active: open, ref: sheetRef, onClose: close })

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 border-b transition-[height,background-color,border-color] duration-300",
        condensed
          ? "h-16 border-border bg-surface/85 backdrop-blur-md"
          : "h-22 border-transparent bg-transparent",
      )}
      style={{ zIndex: "var(--z-nav)" }}
    >
      <nav
        aria-label="Sections"
        className="mx-auto flex h-full max-w-page items-center justify-between gap-4 px-inset"
      >
        {/*
          Scrolls to top. NOT an anchor to "/" — docs/product.md §2.1. A persona
          page has no path back to the homepage, and the logo is exactly where
          that link would otherwise appear.
        */}
        <button
          type="button"
          onClick={toTop}
          className="rounded-sm font-display text-h3 font-bold tracking-tight transition-colors duration-150 hover:text-accent"
        >
          RK<span className="text-accent">.</span>
          <span className="sr-only"> — scroll to top</span>
        </button>

        <div className="flex items-center gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`${basePath}#${s.id}`}
                  aria-current={active === s.id ? "location" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-sm px-3 font-mono text-meta uppercase transition-colors duration-150",
                    active === s.id ? "text-accent" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}

            {blogHref ? (
              <li>
                <a
                  href={blogHref}
                  className="inline-flex min-h-11 items-center rounded-sm px-3 font-mono text-meta uppercase text-ink-muted transition-colors duration-150 hover:text-ink"
                >
                  Writing
                </a>
              </li>
            ) : null}
          </ul>

          <ThemeToggle />

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Open navigation menu"
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink active:scale-97 md:hidden"
          >
            <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {open ? (
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 flex flex-col bg-base md:hidden"
          style={{ zIndex: "var(--z-modal)" }}
        >
          <div className="flex h-16 items-center justify-end px-inset">
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation menu"
              className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink active:scale-97"
            >
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <ul className="flex flex-col gap-2 px-inset pt-8">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`${basePath}#${s.id}`}
                  onClick={close}
                  aria-current={active === s.id ? "location" : undefined}
                  /* 40ms stagger, §4.2. `backwards` fill holds the from-state. */
                  className="animate-rise-in inline-flex min-h-11 items-center font-display text-h1 font-semibold"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {s.label}
                </a>
              </li>
            ))}

            {blogHref ? (
              <li>
                <a
                  href={blogHref}
                  onClick={close}
                  className="animate-rise-in inline-flex min-h-11 items-center font-display text-h1 font-semibold"
                  style={{ animationDelay: `${sections.length * 0.04}s` }}
                >
                  Writing
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </header>
  )
}
