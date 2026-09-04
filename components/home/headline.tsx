import { STAGGER_STEP } from "@/lib/motion"

/**
 * Hero headline mask-reveal — docs/design-system.md §4.3.
 *
 * Each line sits in an overflow-hidden band and slides up from beneath it, so
 * the type appears to be uncovered rather than to fly in.
 *
 * Deliberately CSS, not Framer, and therefore a server component with zero
 * client JS. This is the LCP text: a `motion` component here would serialize
 * `transform: translateY(110%)` into the SSR markup and leave the name hidden
 * beneath its mask until hydration — invisible entirely with JS disabled.
 * The CSS animation paints off the first frame and needs no runtime.
 *
 * `backwards` fill holds the from-state through the stagger delay without ever
 * writing a hiding style into the server HTML.
 */
export function Headline({ lines, className }: { lines: readonly string[]; className?: string }) {
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          <span
            className="animate-mask-up block"
            style={{ animationDelay: `${i * STAGGER_STEP * 2}s` }}
          >
            {line}
          </span>
        </span>
      ))}
    </h1>
  )
}
