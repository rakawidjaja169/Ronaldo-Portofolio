"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence } from "framer-motion"
import { Expand } from "lucide-react"

import { Lightbox } from "@/components/persona/lightbox"
import type { WorkImage } from "@/content/work"

/**
 * Case-study gallery — docs/product.md §5.2, docs/design-system.md §6.
 *
 * "Gallery images open in the same lightbox component" is the specification,
 * and this is the second consumer of it. `Lightbox` needed no change: it is
 * fully controlled and stateless, so all that is owned here is which image is
 * open and which button to hand focus back to.
 *
 * FOCUS RETURN IS THIS COMPONENT'S JOB. The lightbox deliberately does not do
 * it — "only the opener knows which button to go back to" — so `onClose` below
 * is not optional politeness, it is the §7 escape route. Each thumbnail is its
 * own trigger, so the ref is captured at open rather than held per index.
 *
 * The buttons and their images are server-rendered by the surrounding page and
 * ship with the document, so with JS off the gallery degrades to a grid of
 * plain images with captions — smaller than the lightbox, still all there.
 *
 * A single-image gallery still renders as a gallery. The alternative is a
 * second layout branch to maintain for the case where a project has one
 * screenshot, which is most of them.
 */
export function CaseStudyGallery({
  images,
  title,
}: {
  images: readonly WorkImage[]
  title: string
}) {
  const [index, setIndex] = useState<number | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const onOpen = useCallback((i: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    setIndex(i)
  }, [])

  const onClose = useCallback(() => {
    setIndex(null)
    triggerRef.current?.focus()
  }, [])

  if (images.length === 0) return null

  return (
    <>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={(e) => onOpen(i, e.currentTarget)}
              /*
                The alt text already says what the image is, so repeating it in
                the label would read it twice. "Enlarge" plus the position is
                the action and the context; the alt on the child image supplies
                the subject.
              */
              aria-label={`Enlarge image ${i + 1} of ${images.length}`}
              className="group relative block w-full overflow-hidden rounded-md border border-border bg-surface-2 transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-elev-2"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            >
              <Image
                src={image.thumb}
                alt={image.alt}
                fill
                /* §8: below the fold without exception — the gallery sits under the prose. */
                loading="lazy"
                sizes="(min-width: 640px) 45vw, 90vw"
                className="object-cover object-top transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
              />
              <span className="absolute right-3 bottom-3 inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface/90 text-ink-muted backdrop-blur-sm transition-colors duration-150 group-hover:text-ink">
                <Expand size={18} strokeWidth={1.5} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {index !== null ? (
          <Lightbox
            images={images}
            title={title}
            index={index}
            onIndexChange={setIndex}
            onClose={onClose}
            originRect={triggerRef.current?.getBoundingClientRect() ?? null}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
