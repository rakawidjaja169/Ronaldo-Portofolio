/**
 * Competency groups — docs/product.md §5.1 ("Skills").
 *
 * SERVER ONLY, same rule as content/work.ts and content/experience.ts.
 *
 * TEXT, NOT LOGOS. The old scaffold carried twelve tech logos in `public/`.
 * Twelve of the ~20 skills listed here have one, so a logo wall would present
 * an arbitrary subset as if it were the whole list — and "sprint planning" has
 * no logo at all, which is the half of this section a hiring reader is actually
 * weighing. The logo files are deleted in this milestone; they survive in git
 * history at `1ea7f90` if a later design wants them.
 */

import type { PersonaCode } from "@/content/personas"

export type SkillGroup = {
  label: string
  items: readonly string[]
}

const swe: readonly SkillGroup[] = [
  {
    label: "Languages",
    items: ["PHP", "TypeScript", "JavaScript", "SQL"],
  },
  {
    label: "Frameworks and runtime",
    items: ["Laravel", "CodeIgniter", "Vue", "React", "Next.js", "Node"],
  },
  {
    label: "Data and infrastructure",
    items: ["MySQL", "SQL Server", "MongoDB", "Redis", "Docker"],
  },
  {
    label: "Practices",
    items: [
      "Sprint planning",
      "Backlog grooming",
      "MoSCoW prioritisation",
      "Kanban delivery",
      "Stakeholder feedback loops",
    ],
  },
]

const skills: Partial<Record<PersonaCode, readonly SkillGroup[]>> = { swe }

/** Empty for a persona with no skills list — the section renders heading only. */
export function getSkills(code: PersonaCode): readonly SkillGroup[] {
  return skills[code] ?? []
}
