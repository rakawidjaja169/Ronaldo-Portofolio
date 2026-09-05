/**
 * Career timeline — docs/product.md §5.1 ("Experience"), docs/design-system.md §6.
 *
 * SERVER ONLY, same rule as content/work.ts: `Timeline` receives its entries as
 * props and never imports this file. Kept out of the `Persona` type for the
 * same reason `work` is — the registry stays a small, readable index, and a
 * persona with no timeline is an absent key rather than an empty array to
 * remember.
 *
 * Education is an entry in this list, not a section of its own. One degree does
 * not earn a landmark, and `persona.sections` is what decides landmarks.
 *
 * VOICE. These bullets are rewritten from the résumé prose recovered at
 * `1ea7f90` (parked in content/_raw-experience.md). Every fact and number
 * survives; the résumé scaffolding does not. "Aligning delivery with
 * institutional priorities" asserts nothing a reader can check, and a portfolio
 * is read by someone deciding whether to trust the work.
 */

import type { PersonaCode } from "@/content/personas"

export type ExperienceEntry = {
  role: string
  org: string
  /**
   * `YYYY` or `YYYY-MM`. Rendered in mono tabular figures (§2.2); `end: null`
   * renders "Present". Stored as data, not as a display string, so the format
   * is decided once in the component rather than in twelve string literals.
   */
  start: string
  end: string | null
  /** 2–3 lines. Empty is legal — education carries no bullets. */
  points: readonly string[]
}

const swe: readonly ExperienceEntry[] = [
  {
    role: "Software Engineer & Project Lead",
    org: "Yayasan Pendidikan Pelita Harapan — SDH Head Office",
    start: "2023-03",
    end: null,
    points: [
      "Set the roadmap and ran sprint planning across 8+ internal applications — data warehouse, ticketing, asset management, digital asset management.",
      "Prioritised with MoSCoW, so release order reflected both what stakeholders needed soonest and what the team could actually build.",
      "Shipped a ticketing system with full logging and reporting, replacing manual tracking with numbers the team could evaluate against.",
    ],
  },
  {
    role: "Software Engineer, Full Stack",
    org: "Yayasan Pendidikan Pelita Harapan — SDH Head Office",
    start: "2022-03",
    end: "2023-02",
    points: [
      "Built and launched Online Admission, an LMS, and a school management system used by thousands of staff and students — Laravel, Vue, CodeIgniter, MySQL, SQL Server.",
      "Cut page load times by 40% by profiling what the applications were actually waiting on and rewriting the queries underneath.",
      "Ran weekly feedback sessions with the people using the systems and fed what came back into the next sprint.",
    ],
  },
  {
    role: "Project Manager & Backend Intern",
    org: "PITOO.COOP",
    start: "2021-09",
    end: "2021-12",
    points: [
      "Scoped the MVP with the CTO and CEO: authentication, user profiles, real-time multiplayer.",
      "Led a 3-person team on Kanban, shipping milestone builds the founders could put in front of players.",
      "Designed the backend schema and the real-time layer the multiplayer sessions ran on.",
    ],
  },
  {
    role: "Assistant Professor",
    org: "Universitas Pelita Harapan",
    start: "2020-08",
    end: "2021-05",
    points: [
      "Taught Calculus and Operating Systems, writing the lectures, assignments, and lab exercises from scratch.",
      "Average exam scores rose 22% after moving to project-based assessment and active-learning sessions.",
    ],
  },
  {
    role: "Bachelor of Computer Science",
    org: "Universitas Pelita Harapan",
    start: "2018",
    end: "2022",
    points: [],
  },
]

const experience: Partial<Record<PersonaCode, readonly ExperienceEntry[]>> = { swe }

/** Empty for a persona with no timeline — the section then renders heading only. */
export function getExperience(code: PersonaCode): readonly ExperienceEntry[] {
  return experience[code] ?? []
}
