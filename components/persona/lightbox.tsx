"use client"

import { useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import type { WorkImage } from "@/content/work"
import { duration, ease, springSoft } from "@/lib/motion"
import { useFocusTrap } from "@/lib/use-focus-trap"

/**
 * Image lightbox — docs/design-system.md §6 (`Lightbox`), §4.3, §7.
 *
 * Mounted only while open, so its markup never ships with the document and the
 * no-JS page has no orphan dialog in it.
 *
 * ARROW KEYS ARE AN ACCELERATOR, NEVER THE ONLY WAY (§7). Prev, next, and close
 * are real buttons with labels; the key handler is a second path to the same
 * three functions.
 *
 * §4.3 asks for a shared-element scale from the clicked thumbnail. This does it
 * by reading the trigger's bounding rect and animating scale from it, rather
 * than with Framer's `layoutId`: the grid the thumbnail lives in is filterable,
 * and a layout animation across a list that is simultaneously being filtered is
 * exactly the CLS the milestone's done-criterion forbids. The visual result —
 * the panel growing out of the card you clicked — is the same.
 *
 * Adjacent images are rendered into the DOM at index ±1 and hidden, which is
 * the whole of §6's "preloads the adjacent image". A manual <link rel=preload>
 * would point at the raw src and miss next/image's generated srcset entirely.
 */
export function Lightbox({
  images,
  title,
  index,
  onIndexChange,
  onClose,
  originRect,
}: {
  images: readonly WorkImage[]
  title: string
  index: number
  onIndexChange: (next: number) => void
  onClose: () => void
  /** Bounding box of the button that opened this, for the grow-from origin. */
  originRect: DOMRect | null
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useFocusTrap({ active: true, ref: dialogRef, onClose })

  const go = useCallback(
    (step: number) => {
      onIndexChange((index + step + images.length) % images.length)
    },
    [index, images.length, onIndexChange],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "ArrowRight") go(1)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [go])

  const current = images[index]
  if (!current) return null

  /*
    Grow-from-origin. Without a rect (keyboard activation reports one too, so
    this is only the defensive branch) it falls back to a plain scale-up.
  */
  const from =
    originRect && !reduced
      ? {
          opacity: 0,
          scale: 0.6,
          x: originRect.left + originRect.width / 2 - window.innerWidth / 2,
          y: originRect.top + originRect.height / 2 - window.innerHeight / 2,
        }
      : { opacity: 0, scale: reduced ? 1 : 0.96, x: 0, y: 0 }

  return (
    <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }}>
      {/*
        Scrim. A div, not a button: it carries no accessible name and is not in
        the tab order, because Esc and the labelled Close button are the
        keyboard escape routes. Clicking it is a pointer convenience.
      */}
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.in } }}
        transition={{ duration: duration.base, ease: ease.out }}
        className="absolute inset-0 bg-scrim backdrop-blur-sm"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — screenshot ${index + 1} of ${images.length}`}
        initial={from}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        /*
          Enter is the spring; exit is an explicit tween carried on the exit
          variant itself, which is where Framer looks for a per-variant
          transition. §4.2 asks that exit be faster than enter, and springSoft
          applied to exit measured ~700ms — long enough that the body scroll
          lock, released on unmount, was still held well after Esc closed it.
        */
        exit={{
          opacity: 0,
          scale: 0.98,
          transition: reduced ? { duration: 0.01 } : { duration: duration.fast, ease: ease.in },
        }}
        transition={reduced ? { duration: 0.01 } : springSoft}
        /*
          The panel is full-bleed, so it covers the scrim at every coordinate
          and the scrim's own onClick can never fire. Close-on-outside is
          therefore handled here: a click that lands on the panel itself rather
          than on any of its children is a click on empty space around the
          figure, which is what "outside" means to the user. Children stop it
          by being the target — no stopPropagation to maintain.
        */
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-inset"
      >
        <div className="flex w-full max-w-page items-center justify-between gap-4">
          <p className="font-mono text-meta uppercase text-ink-muted">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink active:scale-97"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <figure className="flex w-full max-w-page flex-1 flex-col items-center justify-center gap-3 overflow-hidden">
          <div
            className="relative w-full overflow-hidden rounded-md border border-border bg-surface"
            style={{ aspectRatio: `${current.width} / ${current.height}` }}
          >
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-contain"
            />
          </div>
          <figcaption className="text-center text-body-s text-ink-muted">{current.alt}</figcaption>
        </figure>

        {images.length > 1 ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous screenshot"
              className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink active:scale-97"
            >
              <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>

            <p className="font-mono text-meta tabular-nums text-ink-muted" aria-live="polite">
              {index + 1} / {images.length}
            </p>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next screenshot"
              className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink active:scale-97"
            >
              <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </motion.div>

      {/* Adjacent preload — see the docblock. Off-screen, not display:none, so
          the browser actually fetches them. */}
      <div aria-hidden="true" className="pointer-events-none absolute size-px overflow-hidden opacity-0">
        {[-1, 1].map((step) => {
          const neighbour = images[(index + step + images.length) % images.length]
          return neighbour && neighbour !== current ? (
            <Image
              key={neighbour.src}
              src={neighbour.src}
              alt=""
              width={16}
              height={10}
              sizes="(min-width: 1280px) 1280px, 100vw"
            />
          ) : null
        })}
      </div>
    </div>
  )
}
