"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"

import { Lightbox } from "@/components/persona/lightbox"
import { ProjectCard } from "@/components/persona/project-card"
import { RevealGroup, RevealItem } from "@/components/ui/reveal"
import type { WorkItem } from "@/content/work"
import { cn } from "@/lib/utils"

/**
 * Selected work — docs/product.md §5.1, docs/design-system.md §6, §4.3.
 *
 * Client because it owns two pieces of state: the active tag filter and which
 * gallery is open. Items arrive as props and this never imports
 * content/personas.ts — same rule as the nav, and for the same reason.
 *
 * CLS WHILE FILTERING is the milestone's hard requirement (< 0.05). Two things
 * hold it: every card's image sits in a fixed `aspect-[16/10]` box so a card's
 * own height never depends on a loaded image, and filtering only adds or
 * removes whole grid items — nothing inside a surviving card reflows. The page
 * below the grid does move when the grid shortens, but that is a
 * user-initiated interaction and excluded from CLS by definition.
 */
export function WorkGrid({
  items,
  personaCode,
}: {
  items: readonly WorkItem[]
  personaCode: string
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [open, setOpen] = useState<{ slug: string; index: number } | null>(null)
  /* The button that opened the gallery: its rect drives the open animation and
     it is where focus goes on close. */
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  /* Derived from the items, so a new tag on a project needs no config edit. */
  const tags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags))].sort(),
    [items],
  )

  const visible = useMemo(
    () => (activeTag ? items.filter((item) => item.tags.includes(activeTag)) : items),
    [items, activeTag],
  )

  const openItem = open ? items.find((item) => item.slug === open.slug) : undefined

  /*
    The stagger is uncapped. lib/motion.ts declares STAGGER_MAX_ITEMS = 8 and at
    six projects × 40ms the last card enters 240ms after the first, which is
    inside §4.2's budget. Enforcing the cap needs per-item delays instead of
    Framer's `staggerChildren`, and there is nothing yet to enforce it against.
    Revisit if this list passes eight.
  */

  const onOpen = useCallback((slug: string, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    setOpen({ slug, index: 0 })
  }, [])

  const onClose = useCallback(() => {
    setOpen(null)
    /*
      Focus return. The trap hook deliberately does not do this — see its
      docblock — because only the opener knows which button to go back to.
    */
    triggerRef.current?.focus()
  }, [])

  return (
    <div className="mt-12">
      {tags.length > 0 ? (
        <ul className="mb-8 flex flex-wrap gap-2" aria-label="Filter work by tag">
          <li>
            <FilterChip active={activeTag === null} onClick={() => setActiveTag(null)}>
              All
            </FilterChip>
          </li>
          {tags.map((tag) => (
            <li key={tag}>
              <FilterChip active={activeTag === tag} onClick={() => setActiveTag(tag)}>
                {tag}
              </FilterChip>
            </li>
          ))}
        </ul>
      ) : null}

      {visible.length > 0 ? (
        <RevealGroup as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <RevealItem as="li" key={item.slug}>
              <ProjectCard
                item={item}
                personaCode={personaCode}
                onOpen={(trigger) => onOpen(item.slug, trigger)}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      ) : (
        <div className="rounded-md border border-border bg-surface p-10 text-center">
          <p className="font-display text-h3 font-semibold">No work tagged “{activeTag}”</p>
          <p className="mt-2 text-body-s text-ink-muted">
            Nothing here matches that filter yet.
          </p>
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-border px-4 font-mono text-meta uppercase transition-colors duration-150 hover:bg-surface-2 active:scale-97"
          >
            Show all work
          </button>
        </div>
      )}

      <AnimatePresence>
        {openItem && open ? (
          <Lightbox
            key={openItem.slug}
            images={openItem.images}
            title={openItem.title}
            index={open.index}
            onIndexChange={(index) => setOpen({ slug: openItem.slug, index })}
            onClose={onClose}
            originRect={triggerRef.current?.getBoundingClientRect() ?? null}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/** Tag chip — design-system.md §6. `aria-pressed` is what makes it a toggle. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 items-center rounded-sm px-4 font-mono text-meta uppercase transition-colors duration-150 active:scale-97",
        active
          ? "bg-accent-quiet text-accent-text"
          : "border border-border text-ink-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}
