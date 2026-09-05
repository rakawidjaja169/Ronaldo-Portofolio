/**
 * Case studies — docs/product.md §5.2, §6.
 *
 * SERVER ONLY, same rule as content/work.ts and content/personas.ts. The MDX
 * body renders on the server; nothing in components/ imports this file.
 *
 * FRONTMATTER IS AN ESM EXPORT, NOT YAML. MDX supports `export const` natively,
 * so `meta` is a real JavaScript object in the same file as the prose — no
 * `gray-matter`, no YAML parser, and no second source of truth to drift.
 *
 * ...WHICH IS WHY zod IS HERE AND EARNING ITS PLACE. `@types/mdx` types every
 * MDX module as `any`, so TypeScript cannot see that object at all: without a
 * runtime check, a typo in a `meta` key would ship as a blank field rather
 * than fail. The schema below runs during `next build`, because
 * generateStaticParams and the page are its only callers — which is exactly
 * the "a malformed post fails the build instead of shipping broken" that §6
 * asks for.
 *
 * A STATIC MAP, NOT A GLOB. `dynamicParams = false` means the slug set has to
 * be known at build time anyway, and an explicit map makes an unregistered
 * file a visible omission instead of a silent publish. Every key here is also
 * a `WorkItem.slug` in content/work.ts; the [case study · routing] test group
 * is what keeps the two lists from drifting apart.
 */

import type { ComponentType } from "react"
import { z } from "zod"

import type { PersonaCode } from "@/content/personas"

const metaSchema = z.object({
  title: z.string().min(1),
  /** One sentence. Feeds the page description, so it is never empty. */
  summary: z.string().min(1),
  role: z.string().min(1),
  /** Mono tabular in the meta row, e.g. "2023 — 2024". */
  period: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  /**
   * `null`, not optional. An internal system has no live URL and no public
   * repo, and writing that out is a decision; an absent key is a lapse.
   */
  links: z.object({
    live: z.string().url().nullable(),
    repo: z.string().url().nullable(),
  }),
})

/**
 * The whole module, not just `meta`. `@types/mdx` declares "*.mdx" with a
 * single `default` export and nothing else, so a Loader typed as
 * `{ default: ComponentType; meta: unknown }` does not typecheck and the only
 * alternative to validating here is a cast — which asserts the exact thing
 * that is unverified. Checking `default` as well costs one line and means the
 * cast never has to exist.
 */
const moduleSchema = z.object({
  default: z.custom<ComponentType>((value) => typeof value === "function", {
    message: "no default export — the MDX body is missing",
  }),
  meta: metaSchema,
})

export type CaseStudyMeta = z.infer<typeof metaSchema>

export type CaseStudy = {
  slug: string
  meta: CaseStudyMeta
  /** The compiled MDX body. Rendered inside the page's prose container. */
  Body: ComponentType
}

type Loader = () => Promise<unknown>

const swe: Record<string, Loader> = {
  "online-admission-sdh": () => import("./projects/swe/online-admission-sdh.mdx"),
  "ticketing-system": () => import("./projects/swe/ticketing-system.mdx"),
  "asset-inventory": () => import("./projects/swe/asset-inventory.mdx"),
  "facility-management": () => import("./projects/swe/facility-management.mdx"),
  "moodle-lms": () => import("./projects/swe/moodle-lms.mdx"),
  "evaluation-system": () => import("./projects/swe/evaluation-system.mdx"),
}

const studies: Partial<Record<PersonaCode, Record<string, Loader>>> = { swe }

/** Empty for a persona with no case studies — the same `?? []` the other getters use. */
export function getCaseStudySlugs(code: PersonaCode): readonly string[] {
  return Object.keys(studies[code] ?? {})
}

/**
 * `undefined` for an unknown persona or slug, which the route turns into
 * `notFound()`. Never a redirect: §2.6 — a redirect confirms that valid
 * addresses exist and rewards probing.
 *
 * A validation failure is NOT `undefined`. It throws, because a 404 for a file
 * that exists but is malformed would hide the bug at exactly the moment the
 * build could have caught it.
 */
export async function getCaseStudy(
  code: PersonaCode,
  slug: string,
): Promise<CaseStudy | undefined> {
  const load = studies[code]?.[slug]
  if (!load) return undefined

  const parsed = moduleSchema.safeParse(await load())
  if (!parsed.success) {
    throw new Error(
      `Invalid case study in content/projects/${code}/${slug}.mdx:\n` +
        parsed.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n"),
    )
  }

  return { slug, meta: parsed.data.meta, Body: parsed.data.default }
}
