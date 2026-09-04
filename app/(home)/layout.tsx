import { Footer } from "@/components/home/footer"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Homepage chrome.
 *
 * Deliberately its own route group with its own layout. The persona layout
 * (M2) is a separate file that shares no component with this one, so a nav
 * link cannot leak across by editing something "shared" — there is nothing
 * shared to edit. docs/product.md §2.
 *
 * No nav bar: the page is one screen with nowhere to navigate to. A nav here
 * would be chrome pretending the site is bigger than this visitor should know.
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* First focusable element in the DOM — design-system.md §7. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-surface focus-visible:px-4 focus-visible:py-3 focus-visible:text-body-s focus-visible:text-ink"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-page justify-end px-inset pt-6">
        <ThemeToggle />
      </div>

      <main id="main" className="flex-1">
        {children}
      </main>

      {/* Outside <main>: a footer is a sibling landmark, not page content. */}
      <Footer />
    </div>
  )
}
