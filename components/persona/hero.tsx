import { ArrowDown } from "lucide-react"

import { BackdropPoster } from "@/components/persona/backdrop-poster"
import { Headline } from "@/components/home/headline"
import { RiseIn } from "@/components/ui/rise-in"
import type { Persona } from "@/content/personas"

/**
 * Persona hero — docs/product.md §5.1.
 *
 * Server component, zero client JS. The headline is the LCP element, so it
 * uses the CSS mask-reveal (components/home/headline.tsx) rather than Framer:
 * `motion` serializes `initial` into the SSR markup and the type would sit
 * invisible beneath its mask until hydration, and blank entirely with JS off.
 * Nothing here carries an opacity animation on the LCP element itself — that
 * cost ~1.7s of render delay when M1 tried it.
 *
 * `Headline` is the one component shared with the homepage. It is a
 * presentational primitive taking `lines` as props, not homepage content, so
 * sharing it cannot leak a link across the isolation boundary
 * (docs/product.md §2). Nothing else in components/home/ is imported here.
 *
 * Delay ladder 0 / 0.12 / 0.2 matches the homepage hero — one rhythm, §4.
 */
export function Hero({ persona }: { persona: Persona }) {
  return (
    <section className="relative isolate overflow-hidden">
      <BackdropPoster />

      {/*
        Text sits above the backdrop with its own contrast guarantee: it reads
        --ink on --base regardless of what the field draws behind it (§5).
      */}
      <div
        className="relative mx-auto max-w-page px-inset pb-section pt-32 md:pt-40"
        style={{ zIndex: "var(--z-raised)" }}
      >
        <RiseIn className="font-mono text-meta uppercase text-ink-muted" as="p">
          {persona.role}
        </RiseIn>

        <Headline
          lines={persona.headline}
          className="mt-6 max-w-[16ch] font-display text-display-xl font-bold"
        />

        <RiseIn delay={0.12}>
          <p className="mt-8 max-w-[45ch] text-body-l text-ink-muted">{persona.positioning}</p>
        </RiseIn>

        <RiseIn delay={0.2} className="mt-12">
          {/*
            In-page anchor, never a path. It is also the page's single accent
            fill — §1.4 caps accent at two appearances per viewport, and the
            focus ring is the other one.
          */}
          <a
            href={persona.cta.href}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 py-3 text-body font-medium text-on-accent transition-colors duration-150 hover:bg-accent-hover active:scale-97"
          >
            {persona.cta.label}
            <ArrowDown size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </RiseIn>
      </div>
    </section>
  )
}
