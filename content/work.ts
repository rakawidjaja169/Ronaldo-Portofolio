/**
 * Work items — docs/product.md §5.1 ("Selected work"), docs/design-system.md §6.
 *
 * SERVER ONLY, same rule as content/personas.ts: the grid is a client component
 * because it owns filter state, so it receives its items as props. This file is
 * imported by app/[persona]/page.tsx and nowhere in components/.
 *
 * Image dimensions are stored rather than inferred. `next/image` needs them to
 * reserve space (§8 CLS budget), and the lightbox needs the aspect ratio before
 * the file has loaded.
 *
 * SCREENSHOT PUBLICATION. Only `online-admission-sdh` shows real screenshots:
 * it is public software at a public URL. The other five are an employer's
 * internal admin tools, so they carry a generated abstraction instead — see
 * scripts/generate-app-visuals.mjs. Each is a schematic of how that system is
 * organised, drawn in the site's own tokens, and its alt text says so outright:
 * a drawing a reader mistakes for a screenshot would be a worse failure than
 * the flat placeholder it replaced. Publishing an internal admin screen is the
 * one thing here that an edit cannot take back once it is cached and scraped.
 *
 * The raw screenshot sets survive in git at c35dee3, and the publication gate
 * in scripts/prepare-work-images.mjs still stands: if permission ever arrives,
 * adding one entry to its SETS list regenerates that project's real shots.
 */

import type { PersonaCode } from "@/content/personas"

export type WorkImage = {
  /** Full-size, lightbox. */
  src: string
  /** Card thumbnail, 800x500. */
  thumb: string
  alt: string
  width: number
  height: number
}

export type WorkItem = {
  /** Also the M4 case-study slug. */
  slug: string
  title: string
  /** One line, ~90 characters. What it does and who it serves. */
  outcome: string
  tags: readonly string[]
  /** Mono tabular in the card meta row. */
  year: string
  /** Live URL. Omitted when the system is internal. */
  href?: string
  /**
   * The card links to /[persona]/work/[slug] only when this is true. It stayed
   * false through M3 because the route did not exist and a card linking to a
   * 404 is worse than a card that does not link; M4 built the route and every
   * item now has a study, so the flag has no false case today. It stays because
   * a persona added later will have items before it has case studies.
   */
  hasCaseStudy: boolean
  images: readonly WorkImage[]
}

/**
 * The generated stand-in for a project whose screenshots are not published.
 * Produced by scripts/generate-app-visuals.mjs, one distinct composition per
 * slug. `description` completes the sentence "Abstract schematic of ..." so
 * every alt string states what the image is and why it is not a screenshot.
 */
function visual(slug: string, description: string): readonly WorkImage[] {
  return [
    {
      src: `/work/${slug}.webp`,
      thumb: `/work/${slug}-thumb.webp`,
      alt: `Abstract schematic of ${description} — not a screenshot; this is an internal system and its screens are not published`,
      width: 1600,
      height: 1000,
    },
  ]
}

/** Five shots of the SDH admission portal, from scripts/prepare-work-images.mjs. */
const admissionShots: readonly WorkImage[] = [
  {
    src: "/work/online-admission-sdh/0.webp",
    thumb: "/work/online-admission-sdh/0-thumb.webp",
    alt: "Public landing page of the SDH admission portal",
    width: 1600,
    height: 775,
  },
  {
    src: "/work/online-admission-sdh/1.webp",
    thumb: "/work/online-admission-sdh/1-thumb.webp",
    alt: "Applicant dashboard listing the registration steps",
    width: 1600,
    height: 809,
  },
  {
    src: "/work/online-admission-sdh/2.webp",
    thumb: "/work/online-admission-sdh/2-thumb.webp",
    alt: "Multi-step admission form with student and parent details",
    width: 1600,
    height: 707,
  },
  {
    src: "/work/online-admission-sdh/3.webp",
    thumb: "/work/online-admission-sdh/3-thumb.webp",
    alt: "Administrator dashboard showing applications by campus",
    width: 1600,
    height: 724,
  },
  {
    src: "/work/online-admission-sdh/4.webp",
    thumb: "/work/online-admission-sdh/4-thumb.webp",
    alt: "Reporting view with filters and exportable admission data",
    width: 1600,
    height: 719,
  },
]

const swe: readonly WorkItem[] = [
  {
    slug: "online-admission-sdh",
    title: "Online Admission SDH",
    outcome:
      "End-to-end student enrolment for 17 campuses: account, form, payment gateway, and document upload.",
    tags: ["Web", "Enterprise", "Payments"],
    year: "2022",
    href: "https://sdh.or.id/registrasi/",
    hasCaseStudy: true,
    images: admissionShots,
  },
  {
    slug: "ticketing-system",
    title: "Ticketing System",
    outcome: "TODO — one line: what the helpdesk system does and who it serves.",
    tags: ["Web", "Internal Tools"],
    year: "2023",
    hasCaseStudy: true,
    images: visual("ticketing-system", "the ticket queue, showing work moving through its status lanes"),
  },
  {
    slug: "asset-inventory",
    title: "Asset & Inventory Management",
    outcome: "TODO — one line: what the inventory system tracks and for whom.",
    tags: ["Web", "Internal Tools"],
    year: "2023",
    hasCaseStudy: true,
    images: visual("asset-inventory", "the asset register, a tile per item with a few flagged for attention"),
  },
  {
    slug: "facility-management",
    title: "Facility Management",
    outcome: "TODO — one line: what facility work this system coordinates.",
    tags: ["Web", "Internal Tools"],
    year: "2023",
    hasCaseStudy: true,
    images: visual("facility-management", "a site floorplan with one maintenance request routed between buildings"),
  },
  {
    slug: "moodle-lms",
    title: "Moodle LMS",
    outcome: "TODO — one line: what was built on top of Moodle and why.",
    tags: ["Web", "Education", "Integration"],
    year: "2022",
    hasCaseStudy: true,
    images: visual("moodle-lms", "stacked course modules, each with its own completion rule"),
  },
  {
    slug: "evaluation-system",
    title: "Evaluation System",
    outcome: "TODO — one line: what the evaluation system measures and reports.",
    tags: ["Web", "Internal Tools", "Reporting"],
    year: "2024",
    hasCaseStudy: true,
    images: visual("evaluation-system", "a criteria matrix, each cell weighted by score"),
  },
]

const work: Partial<Record<PersonaCode, readonly WorkItem[]>> = { swe }

/** Empty for a persona with no work list, so the grid renders its empty state. */
export function getWork(code: PersonaCode): readonly WorkItem[] {
  return work[code] ?? []
}
