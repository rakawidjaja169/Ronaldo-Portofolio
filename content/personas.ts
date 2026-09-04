/**
 * Persona registry.
 *
 * M1 defines only the codes — robots.ts needs them to exclude persona paths
 * from crawling, and that exclusion is part of the isolation rule
 * (docs/product.md §2) which must hold from the first deploy.
 *
 * M2 expands this into full typed Persona objects and drives
 * generateStaticParams from it.
 */

export const PERSONA_CODES = ["swe", "cst", "cc", "pm", "dsn"] as const

export type PersonaCode = (typeof PERSONA_CODES)[number]

/** Only these are built. The rest are reserved so a code is never reassigned. */
export const BUILT_PERSONAS: readonly PersonaCode[] = ["swe"]

export function isPersonaCode(value: string): value is PersonaCode {
  return (PERSONA_CODES as readonly string[]).includes(value)
}
