import Image from "next/image"

import { ContactLinks } from "@/components/home/contact-links"
import { Headline } from "@/components/home/headline"
import { RiseIn } from "@/components/ui/rise-in"
import { site } from "@/content/site"

/**
 * Homepage hero — the whole homepage, effectively.
 *
 * docs/product.md §4: name, one-line positioning, portrait, contact links.
 * Nothing else. No project list, no role framing, no persona links — a visitor
 * who trimmed a persona code off the URL must learn nothing here.
 *
 * Server component, and so is every child — this page ships no motion JS at
 * all. The entrance is CSS (see RiseIn), which is what keeps LCP off the
 * hydration critical path and keeps the page readable with JS disabled.
 */
export function Hero() {
  return (
    <section className="mx-auto grid max-w-page gap-x-16 gap-y-12 px-inset py-section md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="order-2 md:order-1">
        <RiseIn className="font-mono text-meta uppercase text-ink-muted">
          <p>{site.location}</p>
        </RiseIn>

        <Headline
          lines={["Ronaldo", "Katriel"]}
          className="mt-6 font-display text-display-xl font-bold"
        />

        <RiseIn delay={0.12}>
          <p className="mt-6 text-body text-ink-muted">
            {/* Deliberately understated: it is an aside, not a second name. */}
            You can call me {site.alias}.
          </p>

          <p className="mt-6 max-w-[45ch] text-body-l text-ink-muted">{site.positioning}</p>
        </RiseIn>

        <RiseIn delay={0.2} className="mt-12">
          <ContactLinks />
        </RiseIn>
      </div>

      {/*
        Deliberately NOT wrapped in RiseIn. The portrait is the measured LCP
        element on mobile, and an opacity fade on the LCP element defers the
        paint by the animation duration — the element is not "largest
        contentful" until it is opaque. Fading it cost ~400ms of LCP for a
        flourish nobody asked for, so it renders immediately and the text
        beside it carries the entrance instead.

        Fixed square box with the image absolutely filling it: the space is
        reserved before the image decodes, so there is no layout shift (§8,
        CLS budget 0.05).

        priority — above the fold, and the LCP element on mobile where it
        stacks above the headline.
      */}
      <div className="order-1 md:order-2">
        <div className="relative aspect-square w-[min(72vw,320px)] overflow-hidden rounded-lg border border-border md:w-[clamp(280px,26vw,400px)]">
          <Image
            src="/portrait.webp"
            alt={`${site.name}, seated outdoors`}
            fill
            priority
            sizes="(min-width: 768px) 400px, 72vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
