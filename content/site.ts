/**
 * Site-wide identity and contact.
 *
 * Single source for anything that appears on both the homepage and persona
 * pages. Persona-specific content lives in content/personas/ (M2).
 *
 * NOTE: values marked TODO are placeholders. The previous scaffold carried
 * v0.dev fiction (john.doe@example.com, bare github.com links) and had no real
 * contact data to recover, so these must be supplied before deploying.
 */

export const site = {
  /** Full display name. */
  name: "Ronaldo Katriel",
  /** Informal aside shown under the name. */
  alias: "Raka Widjaja",
  /** One line. What you do, not a slogan. */
  positioning: "Software engineer building internal platforms that people actually use.",
  /** Where the work happens. */
  location: "Jakarta, Indonesia",
} as const

export type ContactLink = {
  label: string
  /** Shown instead of the raw URL. Keeps mailto:/https:// out of the UI. */
  display: string
  href: string
  icon: "mail" | "linkedin" | "github" | "file"
  /** External links get rel/target; mailto and same-origin do not. */
  external?: boolean
}

export const contactLinks: readonly ContactLink[] = [
  {
    label: "Email",
    display: "TODO@example.com", // TODO: real address
    href: "mailto:TODO@example.com",
    icon: "mail",
  },
  {
    label: "LinkedIn",
    display: "linkedin.com/in/TODO", // TODO: real handle
    href: "https://www.linkedin.com/in/TODO",
    icon: "linkedin",
    external: true,
  },
  {
    label: "GitHub",
    display: "github.com/TODO", // TODO: real handle
    href: "https://github.com/TODO",
    icon: "github",
    external: true,
  },
] as const

/**
 * CV download. The only PDF in git history is from 2021 and is five years
 * stale, so it is deliberately not restored. Set `available: true` once a
 * current file is placed at `public/cv/ronaldo-katriel-cv.pdf`.
 */
export const cv = {
  available: false,
  href: "/cv/ronaldo-katriel-cv.pdf",
  filename: "Ronaldo-Katriel-CV.pdf",
} as const
