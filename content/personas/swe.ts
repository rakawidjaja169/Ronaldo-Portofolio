/**
 * Software engineer persona — docs/product.md §5.
 *
 * NOTE: prose marked TODO is placeholder. The structure, section ids, and
 * ordering are real and load-bearing (the nav, scroll-spy, and hero CTA all
 * address these ids); only the copy is pending. `npm run check:content` fails
 * while any TODO survives, so this cannot reach a deploy.
 */

import type { Persona } from "@/content/personas"

export const swe: Persona = {
  code: "swe",
  role: "Software Engineer",

  /*
    Two lines, masked separately. Three is the ceiling — at `display-xl` a
    fourth line pushes the positioning copy below the fold on a 375px screen
    and the CTA stops being visible on load.
  */
  headline: ["TODO headline", "TODO second line"],

  positioning: "TODO — one sentence. What you build and who it serves.",

  cta: { label: "See selected work", href: "#work" },

  /*
    Section bodies land across M3 (work), M4 (case studies) and M6 (experience,
    skills, contact). The landmarks and headings exist now so the nav and CTA
    address real anchors from the first commit rather than dead ones.
  */
  sections: [
    { id: "work", label: "Work", heading: "Selected work" },
    { id: "experience", label: "Experience", heading: "Experience" },
    { id: "skills", label: "Skills", heading: "Skills" },
    { id: "contact", label: "Contact", heading: "Get in touch" },
  ],

  meta: {
    title: "Software Engineer",
    description: "TODO — one sentence for search and link previews.",
  },
}
