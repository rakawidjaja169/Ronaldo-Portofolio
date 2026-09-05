import { site } from "@/content/site"

/**
 * Persona footer — docs/product.md §5.1.
 *
 * Contains no link to `/` and no link to another persona. That is the whole
 * specification: §2.1 names the footer as the place a "back home" link gets
 * added by reflex, and this file exists partly to be the thing a reviewer
 * checks. M6 adds social links; it does not add a homepage link.
 *
 * Deliberately not the homepage footer with a prop. A shared component with a
 * `showHomeLink` flag is one wrong default away from leaking.
 */
export function PersonaFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-inset py-8">
        <p className="font-mono text-meta uppercase text-ink-muted">
          © <span className="tabular">{new Date().getFullYear()}</span> {site.name}
        </p>
      </div>
    </footer>
  )
}
