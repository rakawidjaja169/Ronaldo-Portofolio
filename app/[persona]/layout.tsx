import { notFound } from "next/navigation"

import { PersonaFooter } from "@/components/persona/footer"
import { PersonaNav } from "@/components/persona/nav"
import { getPersona, isPersonaCode } from "@/content/personas"

/**
 * Persona chrome.
 *
 * The other half of the contract stated in app/(home)/layout.tsx: that layout
 * and this one share no component, so a nav link cannot leak across the
 * isolation boundary by someone editing something "shared" — there is nothing
 * shared to edit. ThemeToggle is the exception, and it is a control with no
 * href. docs/product.md §2.
 *
 * The nav needs the section list, and a layout cannot read the page's data, so
 * the lookup happens here as well as in page.tsx. Both are build-time server
 * calls into a static object; the duplication costs nothing and keeps the nav
 * off the client's import of the registry.
 */
export default async function PersonaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ persona: string }>
}) {
  const { persona: code } = await params
  if (!isPersonaCode(code)) notFound()

  const persona = getPersona(code)
  if (!persona) notFound()

  return (
    <div className="flex min-h-dvh flex-col">
      {/* First focusable element in the DOM — design-system.md §7. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-surface focus-visible:px-4 focus-visible:py-3 focus-visible:text-body-s focus-visible:text-ink"
      >
        Skip to content
      </a>

      {/*
        Only the id, the label, and one path prefix reach the client. The nav
        never sees the persona code as a code or the registry — see the
        docblock in components/persona/nav.tsx.

        `basePath` is unconditional, because this layout wraps the case studies
        too. A bare `#work` resolves inside /swe/work/<slug> and goes nowhere;
        `/swe#work` is a same-document fragment on /swe itself, so the browser
        still scrolls in place there and the scroll-spy is untouched.
      */}
      <PersonaNav
        sections={persona.sections.map(({ id, label }) => ({ id, label }))}
        basePath={`/${persona.code}`}
        blogHref={`/${persona.code}/blog`}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      {/* Outside <main>: a footer is a sibling landmark, not page content. */}
      <PersonaFooter />
    </div>
  )
}
