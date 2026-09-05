import { Reveal } from "@/components/ui/reveal"
import { ContactLink } from "@/components/ui/contact-link"
import { contactLinks, cv, site, whatsapp } from "@/content/site"

/**
 * Persona contact — docs/product.md §5.1, §7.
 *
 * DIRECT LINKS ONLY. No `<form>`, no `<input>`, no API route, no secrets, no
 * rate limiting to maintain — §7 is explicit and the test asserts the absence,
 * because "we decided not to add a form" is the kind of decision a later commit
 * quietly reverses.
 *
 * `whatsapp` is a separate import from `contactLinks`, not a filtered member of
 * it — see content/site.ts for why the homepage array and the persona's extra
 * link cannot be the same array.
 *
 * The CV control renders only while `cv.available` is true. A download button
 * pointing at a 404 is worse than no button: the same call M3 made for
 * `hasCaseStudy`.
 */
export function ContactBlock() {
  return (
    <Reveal as="div" className="mt-12 max-w-prose">
      <p className="text-body-l text-ink-muted">
        Based in {site.location}. The fastest route is email — everything else below reaches me
        too.
      </p>

      <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-2" aria-label="Contact">
        {[...contactLinks, whatsapp].map((link) => (
          <li key={link.label}>
            <ContactLink link={link} />
          </li>
        ))}
        {cv.available ? (
          <li>
            <ContactLink
              link={{
                label: "Curriculum vitae",
                display: "Download CV",
                href: cv.href,
                icon: "file",
              }}
            />
          </li>
        ) : null}
      </ul>
    </Reveal>
  )
}
