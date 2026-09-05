"use client"

import { useEffect, type RefObject } from "react"

/**
 * Modal focus containment — docs/design-system.md §7, plus the §9 rule that a
 * modal always has an escape route.
 *
 * Extracted from `components/persona/nav.tsx` in M3, when the lightbox became
 * the second consumer. Two things the nav version hardcoded had to generalize:
 * the focusable selector assumed anchors exist (a lightbox has buttons only),
 * and initial focus targeted `a[href]` specifically, which would focus nothing.
 *
 * Focus RETURN is deliberately not here. Each caller owns its trigger ref and
 * decides when to hand focus back — the nav returns on close, the lightbox
 * returns to the card button that opened it. A hook that captured
 * `document.activeElement` on activation would guess wrong the moment a caller
 * opens a dialog from anywhere but a click.
 */

/** Tabbables, in document order. `[tabindex="-1"]` is programmatic-only. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap({
  active,
  ref,
  onClose,
}: {
  active: boolean
  ref: RefObject<HTMLElement | null>
  onClose: () => void
}) {
  useEffect(() => {
    if (!active) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const focusable = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [active, ref, onClose])
}
