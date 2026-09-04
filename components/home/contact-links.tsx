import { Github, Linkedin, Mail } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { contactLinks, type ContactLink } from "@/content/site"

/**
 * Icons resolved from the registry's `icon` key rather than stored as
 * components in content/site.ts — that file must stay plain data so it can be
 * read and edited without touching React. "file" is used by the persona CV link
 * in M6; the homepage carries no CV (docs/product.md §4).
 */
const ICONS: Record<ContactLink["icon"], LucideIcon> = {
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
  file: Mail,
}

/**
 * Direct contact links — docs/product.md §7. No form, no API route.
 *
 * Renders `display`, never the raw href: "linkedin.com/in/name" reads better
 * than a full URL and keeps the mailto: scheme out of the visible text.
 */
export function ContactLinks() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-2" aria-label="Contact">
      {contactLinks.map((link) => {
        const Icon = ICONS[link.icon]
        return (
          <li key={link.label}>
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
              {/* sr-only label: "linkedin.com/in/name" alone is not a clear link purpose. */}
              <span className="sr-only">{link.label}: </span>
              <span className="font-mono">{link.display}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
