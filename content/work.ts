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
 * internal admin tools and that permission is still open, so they point at
 * `_placeholder.webp`. The raw sets survive in git at c35dee3 and
 * scripts/prepare-work-images.mjs regenerates any of them by adding one entry
 * to its SETS list. Publishing an internal admin screen is the one thing here
 * that an edit cannot take back once it is cached and scraped.
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
   * M4 owns /[persona]/work/[slug]. Until that route exists, a card that linked
   * to it would link to a 404, which is worse than a card that does not link
   * yet — so the card link renders only when this is true.
   */
  hasCaseStudy: boolean
  images: readonly WorkImage[]
}

const PLACEHOLDER: WorkImage = {
  src: "/work/_placeholder.webp",
  thumb: "/work/_placeholder.webp",
  alt: "Screenshots not published — this is an internal system",
  width: 800,
  height: 500,
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
    hasCaseStudy: false,
    images: admissionShots,
  },
  {
    slug: "ticketing-system",
    title: "Ticketing System",
    outcome: "TODO — one line: what the helpdesk system does and who it serves.",
    tags: ["Web", "Internal Tools"],
    year: "2023",
    hasCaseStudy: false,
    images: [PLACEHOLDER],
  },
  {
    slug: "asset-inventory",
    title: "Asset & Inventory Management",
    outcome: "TODO — one line: what the inventory system tracks and for whom.",
    tags: ["Web", "Internal Tools"],
    year: "2023",
    hasCaseStudy: false,
    images: [PLACEHOLDER],
  },
  {
    slug: "facility-management",
    title: "Facility Management",
    outcome: "TODO — one line: what facility work this system coordinates.",
    tags: ["Web", "Internal Tools"],
    year: "2023",
    hasCaseStudy: false,
    images: [PLACEHOLDER],
  },
  {
    slug: "moodle-lms",
    title: "Moodle LMS",
    outcome: "TODO — one line: what was built on top of Moodle and why.",
    tags: ["Web", "Education", "Integration"],
    year: "2022",
    hasCaseStudy: false,
    images: [PLACEHOLDER],
  },
  {
    slug: "evaluation-system",
    title: "Evaluation System",
    outcome: "TODO — one line: what the evaluation system measures and reports.",
    tags: ["Web", "Internal Tools", "Reporting"],
    year: "2024",
    hasCaseStudy: false,
    images: [PLACEHOLDER],
  },
]

const work: Partial<Record<PersonaCode, readonly WorkItem[]>> = { swe }

/** Empty for a persona with no work list, so the grid renders its empty state. */
export function getWork(code: PersonaCode): readonly WorkItem[] {
  return work[code] ?? []
}
