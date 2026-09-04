import { site } from "@/content/site"

/**
 * Homepage footer.
 *
 * Server component, so the year is evaluated at build time — a rebuild covers
 * the rollover, and no JS ships for a date.
 *
 * Contains no persona link and no navigation. docs/product.md §2.2: the
 * homepage never enumerates personas, and a footer is the classic place such a
 * link gets added by reflex.
 */
export function Footer() {
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
