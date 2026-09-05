/**
 * Heading id generator. ONE function, TWO callers, and that is the whole point:
 * content/blog.ts builds the outline hrefs with it and mdx-components.tsx sets
 * the heading ids with it, so an id and its outline entry cannot drift apart —
 * they are the same call on the same string.
 *
 * ponytail: PLAIN-TEXT HEADINGS ONLY. content/blog.ts sees raw markdown while
 * mdx-components.tsx sees flattened React children, so a heading containing
 * inline code, a link, or emphasis yields two different strings and the outline
 * link stops resolving. Writing a markdown-inline normalizer on both sides is
 * the fix if that day comes; until then the constraint is enforced by the
 * [blog · outline] group in tests/persona.mjs, which compares every rendered
 * h2/h3 id against every outline href and fails on any mismatch.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
