import { ContactLink } from "@/components/ui/contact-link"
import { contactLinks } from "@/content/site"

/**
 * Homepage contact links — docs/product.md §4, §7. No form, no API route.
 *
 * Renders `contactLinks` and nothing else. `whatsapp` is a separate export in
 * content/site.ts and belongs to the persona contact block; §4 gives the
 * homepage email, LinkedIn and GitHub only.
 *
 * The anchor markup moved to components/ui/contact-link.tsx in M6 when the
 * persona block became its second consumer.
 */
export function ContactLinks() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-2" aria-label="Contact">
      {contactLinks.map((link) => (
        <li key={link.label}>
          <ContactLink link={link} />
        </li>
      ))}
    </ul>
  )
}
