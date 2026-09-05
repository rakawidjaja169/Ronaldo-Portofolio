/**
 * Persona registry — the single source of truth for what exists at `/[code]`.
 *
 * SERVER ONLY. Never import this from a `"use client"` file. It names every
 * reserved code, and shipping that list to the browser publishes the exact
 * enumeration docs/product.md §2 exists to prevent. Client components take
 * what they need as props; that is why `PersonaNav` receives its section list
 * rather than looking a persona up itself.
 */

import { swe } from "@/content/personas/swe"

export const PERSONA_CODES = ["swe", "cst", "cc", "pm", "dsn"] as const

export type PersonaCode = (typeof PERSONA_CODES)[number]

/** Only these are built. The rest are reserved so a code is never reassigned. */
export const BUILT_PERSONAS: readonly PersonaCode[] = ["swe"]

export function isPersonaCode(value: string): value is PersonaCode {
  return (PERSONA_CODES as readonly string[]).includes(value)
}

/**
 * One in-page section. `id` is the anchor the nav, the scroll-spy, and the
 * hero CTA all address, so it is content rather than markup: adding a section
 * to a persona must not mean editing the nav.
 */
export type PersonaSection = {
  id: string
  /** Nav label. Short — it sits in a horizontal bar. */
  label: string
  /** Section opener heading. May differ from the nav label. */
  heading: string
}

export type Persona = {
  code: PersonaCode
  /** Mono eyebrow above the headline. */
  role: string
  /** Headline, one entry per masked line. Keep to two or three. */
  headline: readonly string[]
  /** One line under the headline. What this persona does, not a slogan. */
  positioning: string
  /** Hero CTA. `href` is an in-page anchor — never an outbound path. */
  cta: { label: string; href: string }
  /** Rendered in order. Drives the nav, the scroll-spy, and the page body. */
  sections: readonly PersonaSection[]
  /** Used for `<title>` and the meta description. */
  meta: { title: string; description: string }
}

/**
 * Built personas only. A reserved code has no entry here, so `getPersona`
 * returns undefined and the route 404s — which is what keeps a code reserved
 * rather than half-live.
 */
const personas: Partial<Record<PersonaCode, Persona>> = { swe }

export function getPersona(code: PersonaCode): Persona | undefined {
  return personas[code]
}
