import { type ReactNode } from "react"

import { Reveal } from "@/components/ui/reveal"

/**
 * Section landmark and opener — docs/design-system.md §6 (`Section`).
 *
 * `id` is the anchor the nav, the scroll-spy, and the hero CTA address. The
 * heading is rendered here rather than by each section's body so the visual
 * rhythm cannot drift between M3, M4, and M6.
 *
 * `scroll-mt` clears the sticky nav: without it an anchor jump parks the
 * heading underneath the bar.
 */
export function Section({
  id,
  heading,
  children,
}: {
  id: string
  heading: string
  children?: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border">
      <div className="mx-auto max-w-page px-inset py-section">
        <Reveal>
          <h2 className="font-display text-display-l font-semibold">{heading}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  )
}
