import { Github, Linkedin, Mail, MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { contactLinks, site, whatsapp, type ContactLink } from "@/content/site"

/**
 * Persona footer — docs/product.md §5.1.
 *
 * Contains no link to `/` and no link to another persona. That is the whole
 * specification: §2.1 names the footer as the place a "back home" link gets
 * added by reflex, and this file exists partly to be the thing a reviewer
 * checks. M6 added the social links below; it did not add a homepage link, and
 * the [isolation · links] test group is what keeps that true.
 *
 * Deliberately not the homepage footer with a prop. A shared component with a
 * `showHomeLink` flag is one wrong default away from leaking.
 *
 * Icon-only, so every anchor carries an aria-label and a 44px target (§7). It
 * does not reuse components/ui/contact-link.tsx: that primitive is the labelled
 * text-and-icon form, and squeezing both shapes into one component with a
 * `variant` prop buys nothing here.
 */
const ICONS: Record<ContactLink["icon"], LucideIcon> = {
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
  whatsapp: MessageCircle,
  file: Mail,
}

export function PersonaFooter() {
  const links = [...contactLinks, whatsapp]

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-inset py-8">
        <p className="font-mono text-meta uppercase text-ink-muted">
          © <span className="tabular">{new Date().getFullYear()}</span> {site.name}
        </p>

        <ul className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const Icon = ICONS[link.icon]
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  aria-label={link.label}
                  className="inline-flex size-11 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 hover:bg-surface-2 hover:text-accent active:scale-97"
                >
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </footer>
  )
}
