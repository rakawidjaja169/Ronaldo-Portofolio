import { FileDown, Github, Linkedin, Mail, MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { ContactLink as ContactLinkData } from "@/content/site"

/**
 * One contact anchor — docs/product.md §7, docs/design-system.md §7.
 *
 * Extracted from components/home/contact-links.tsx now that the persona contact
 * block is a second consumer, per the same rule M3 applied to the focus trap:
 * with one consumer the abstraction has nothing to generalize over.
 *
 * SAFE ACROSS THE ISOLATION BOUNDARY, for the reason `Headline` already is. It
 * receives its href as data and has no link of its own, so there is no shared
 * file here in which a homepage↔persona link could later be added. The two
 * content-READING components stay separate — that is where the leak risk
 * actually lives, not in a presentational anchor.
 *
 * `min-h-11` is the §7 44px floor. The sr-only label is what gives the link a
 * clear purpose: "linkedin.com/in/name" alone is a string, not a destination.
 */

/**
 * Icons resolved from the registry's `icon` key rather than stored as
 * components in content/site.ts — that file stays plain data so it can be read
 * and edited without touching React.
 */
const ICONS: Record<ContactLinkData["icon"], LucideIcon> = {
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
  whatsapp: MessageCircle,
  file: FileDown,
}

export function ContactLink({ link }: { link: ContactLinkData }) {
  const Icon = ICONS[link.icon]
  return (
    <a
      href={link.href}
      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5 text-body-s text-ink-muted transition-colors duration-150 hover:border-border-strong hover:bg-surface-2 hover:text-ink active:scale-97"
    >
      <Icon
        size={18}
        strokeWidth={1.5}
        aria-hidden="true"
        className="text-ink-faint transition-colors duration-150 group-hover:text-accent"
      />
      <span className="sr-only">{link.label}: </span>
      <span className="font-mono">{link.display}</span>
    </a>
  )
}
