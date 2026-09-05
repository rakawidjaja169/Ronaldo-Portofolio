"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"

/**
 * Scroll-drawn timeline rail — docs/design-system.md §4.3, §6 (`Timeline`).
 *
 * TRACK AND FILL ARE SEPARATE, and that split is what makes every degraded path
 * correct without a special case:
 *   - JS off: the fill never mounts, the track is an ordinary line.
 *   - Reduced motion: the fill renders at full height, static (§4.4 — plain, not
 *     "animated faster").
 *   - Hydrating: the track paints from the server markup, so nothing appears late.
 * A single element whose height is scroll-driven would be invisible in all three.
 *
 * The rail is `aria-hidden` decoration; the <ol> it wraps carries every fact.
 * Nothing is lost when it does not draw.
 *
 * ABSOLUTELY POSITIONED, so it takes no part in layout and cannot move a
 * sibling — §8 budgets CLS at 0.05 and §4.2 permits transform and opacity only.
 * `scaleY` with `originY: 0` is a transform; animating `height` would not be.
 *
 * The repo's first useScroll. Framer samples it on rAF, which is what §8 asks
 * of scroll handlers — no listener of our own to throttle.
 *
 * MOUNT-GATED for the same reason components/ui/reveal.tsx is. Framer
 * serializes the fill's starting `scaleY(0)` into the SSR markup as an inline
 * style; when the reduced-motion branch then renders a plain <div>, React
 * updates the className but leaves that style attribute in place, and the rail
 * is permanently collapsed. Rendering the plain element first means the server
 * never emits a transform for the client to inherit.
 */
export function TimelineRail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  /*
    Offsets, not defaults: the rail should finish drawing while the last entry
    is still on screen. "end end" would leave it visibly short until the section
    has fully scrolled past, which reads as a bug rather than as progress.
  */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 40%"],
  })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div ref={ref} className="relative">
      {/* Track — always present, server-rendered, never animated. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[3px] top-0 w-px bg-border"
      >
        {reduced || !mounted ? (
          <div className="size-full bg-accent" />
        ) : (
          <motion.div className="h-full w-full origin-top bg-accent" style={{ scaleY }} />
        )}
      </div>
      {children}
    </div>
  )
}
