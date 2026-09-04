/**
 * Shared motion presets — docs/design-system.md §4.1
 *
 * Every animated component imports from here. Ad-hoc per-component spring
 * configs are a review blocker: they are how a site ends up with six subtly
 * different "feels" and no way to tune them together.
 *
 * Rules these encode (§4.2):
 *   - transform and opacity only; never width/height/top/left
 *   - micro-interactions 150-300ms, complex transitions <= 400ms
 *   - exit runs at 60-70% of enter duration
 *   - reveal translate is 24px; more reads as jank
 */
import type { Transition, Variants } from "framer-motion"

export const spring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const satisfies Transition

/** Softer spring for larger surfaces (sheets, modals) where 400 feels snappy. */
export const springSoft = {
  type: "spring",
  stiffness: 220,
  damping: 28,
} as const satisfies Transition

export const duration = {
  fast: 0.15,
  base: 0.24,
  slow: 0.4,
} as const

export const ease = {
  out: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
} as const

/** Distance a revealed element travels. Fixed by §4.2 — do not tune per component. */
export const REVEAL_DISTANCE = 24

/** Delay between staggered children, and the cap past which stagger stops
 *  feeling intentional and starts feeling slow (§4.2). */
export const STAGGER_STEP = 0.04
export const STAGGER_MAX_ITEMS = 8

type Axis = "up" | "down" | "left" | "right"

const OFFSET: Record<Axis, { x: number; y: number }> = {
  up: { x: 0, y: REVEAL_DISTANCE },
  down: { x: 0, y: -REVEAL_DISTANCE },
  left: { x: REVEAL_DISTANCE, y: 0 },
  right: { x: -REVEAL_DISTANCE, y: 0 },
}

/**
 * Scroll/mount reveal. Pair with `whileInView` + `viewport={{ once: true, margin: "-10%" }}`.
 * Exit is deliberately shorter than enter.
 */
export function reveal(axis: Axis = "up", delay = 0): Variants {
  const { x, y } = OFFSET[axis]
  return {
    hidden: { opacity: 0, x, y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: duration.slow, ease: ease.out, delay },
    },
    exit: {
      opacity: 0,
      x,
      y,
      transition: { duration: duration.base, ease: ease.in },
    },
  }
}

/** Parent variant that walks its children in. Children use `reveal()`. */
export function stagger(step: number = STAGGER_STEP, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: step, delayChildren },
    },
    exit: {
      transition: { staggerChildren: step * 0.6, staggerDirection: -1 },
    },
  }
}

/** Standard viewport config for scroll reveals — §4.2. */
export const revealViewport = { once: true, margin: "-10%" } as const

/** Press feedback for tappable surfaces — §4.2. */
export const press = { scale: 0.97 } as const
