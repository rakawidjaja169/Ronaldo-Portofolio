import { type ReactNode } from "react"

/**
 * Above-the-fold entrance. Server component, zero client JS.
 *
 * Use this for anything in the first viewport; use `Reveal` only for content
 * below it. The distinction is not stylistic:
 *
 *   Framer serializes `initial` into the SSR markup as an inline style, so a
 *   `motion` element above the fold ships as `opacity:0` and does not paint
 *   until hydration. On throttled mobile that pushed LCP render delay to
 *   ~2.1s while the image itself loaded in 15ms, and with JS disabled the
 *   page rendered blank — breaking the §7 floor and product.md criterion 6.
 *
 *   A `whileInView` trigger also buys nothing here: content in the first
 *   viewport is already intersecting, so the observer fires immediately. All
 *   it adds is a dependency on hydration.
 *
 * Reduced motion needs no branch. Both keyframes animate *to* the resting
 * state and the global `prefers-reduced-motion` block collapses the duration,
 * so the content simply appears — §4.4's first-class path, reached by doing
 * less rather than more.
 */
export function RiseIn({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: "div" | "section" | "p" | "span" | "ul" | "li" | "header" | "footer"
}) {
  return (
    <Tag
      className={className ? `animate-rise-in ${className}` : "animate-rise-in"}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  )
}
