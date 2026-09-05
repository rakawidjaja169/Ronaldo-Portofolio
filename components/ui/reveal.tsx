"use client"

import { type ReactNode, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { reveal, revealViewport, stagger } from "@/lib/motion"

type Axis = "up" | "down" | "left" | "right"

/**
 * Tags these wrappers can render as. Deliberately a small closed set rather
 * than ElementType: `motion` is a proxy that returns a stable, correctly typed
 * component per tag, and indexing it needs a key it actually has. A wider type
 * forces motion.create() at render time, which mints a new component type on
 * every pass and remounts the subtree.
 */
type Tag = "div" | "section" | "article" | "header" | "footer" | "ul" | "ol" | "li" | "p" | "span"

type BaseProps = {
  children: ReactNode
  className?: string
  as?: Tag
}

/**
 * Scroll reveal — docs/design-system.md §4.2.
 *
 * BELOW THE FOLD ONLY. Framer serializes `initial` into the SSR markup as an
 * inline style, so a Reveal in the first viewport ships as `opacity:0` and
 * does not paint until hydration — blank with JS disabled, and LCP blocked on
 * the JS bundle rather than on content. Use `RiseIn` (CSS, no JS) above the
 * fold. Below it, hydration has finished and an IntersectionObserver is the
 * right tool, which is what this is for.
 *
 * Nothing hidden is ever server-rendered. Framer serializes `initial` into
 * the SSR markup as an inline `opacity:0`, and that style is what the browser
 * paints when JS never arrives — or, as of M2, when reduced motion swaps in
 * the plain branch and React leaves the server's style attribute in place.
 * Either way the content is permanently invisible, which is a content bug, not
 * a motion bug. So the first render is always the plain element, and the
 * motion wrapper mounts in an effect. Below the fold this costs nothing
 * visible: the element is off-screen when the swap happens.
 *
 * The `prefers-reduced-motion` block in globals.css only neutralizes CSS
 * animations. Framer drives transforms through inline style, which walks past
 * that reset untouched, so the check has to happen here in JS.
 *
 * Under reduced motion the element renders plainly — not "animated faster",
 * not animated. §4.4 makes that a first-class path, not a degradation.
 */
/**
 * True only after hydration. Gates every motion wrapper below so the server
 * never emits a hidden element — see the note above.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function Reveal({
  children,
  axis = "up",
  delay = 0,
  className,
  as = "div",
}: BaseProps & { axis?: Axis; delay?: number }) {
  const reduced = useReducedMotion()
  const mounted = useMounted()
  const Tag = as
  const MotionTag = motion[as]

  if (reduced || !mounted) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      variants={reveal(axis, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {children}
    </MotionTag>
  )
}

/**
 * Parent that walks its children in. Children must be `RevealItem` — they read
 * the variant names this sets rather than each running their own viewport
 * trigger, which is what keeps the stagger on one timeline.
 */
export function RevealGroup({
  children,
  className,
  delayChildren = 0,
  as = "div",
}: BaseProps & { delayChildren?: number }) {
  const reduced = useReducedMotion()
  const mounted = useMounted()
  const Tag = as
  const MotionTag = motion[as]

  if (reduced || !mounted) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      variants={stagger(undefined, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {children}
    </MotionTag>
  )
}

/** Child of RevealGroup. Inherits the parent's stagger timing. */
export function RevealItem({
  children,
  axis = "up",
  className,
  as = "div",
}: BaseProps & { axis?: Axis }) {
  const reduced = useReducedMotion()
  const mounted = useMounted()
  const Tag = as
  const MotionTag = motion[as]

  if (reduced || !mounted) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag className={className} variants={reveal(axis)}>
      {children}
    </MotionTag>
  )
}
