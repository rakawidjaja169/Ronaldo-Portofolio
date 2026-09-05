/**
 * Blog posts — docs/product.md §5.3, §6.
 *
 * SERVER ONLY, same rule as content/case-studies.ts. Nothing in components/
 * imports this file; the outline component receives its `toc` as a prop.
 *
 * FRONTMATTER IS AN ESM EXPORT, NOT YAML — see the docblock in
 * content/case-studies.ts for why, and why zod is what makes that safe.
 *
 * THE OUTLINE COMES FROM THE SOURCE TEXT, NOT THE COMPILED MODULE. An MDX
 * default export is a component; extracting its headings would mean rendering
 * it. The .mdx file is right there and is the same bytes the compiler reads,
 * so `analyze` below reads it once with node:fs and derives both the outline
 * and the reading time from that one read. The ids it produces come from
 * lib/slugify.ts, which mdx-components.tsx also calls when it sets the ids on
 * the rendered headings — one function, so the two cannot disagree. Do not add
 * rehype-slug alongside this: it would compute the same ids in a second
 * pipeline that the outline has no way to see.
 *
 * THE fs READS ARE BUILD-TIME ONLY, AND MUST STAY THAT WAY. Every blog route
 * sets `dynamicParams = false` and is fully prerendered, so they happen during
 * `next build`. content/ is not traced into the `output: "standalone"` bundle:
 * flipping dynamicParams to true, or rendering a blog page on demand for any
 * other reason, turns this into an ENOENT in production rather than a missing
 * page.
 */

import { readFileSync } from "node:fs"
import path from "node:path"

import type { ComponentType } from "react"
import { z } from "zod"

import type { PersonaCode } from "@/content/personas"
import { slugify } from "@/lib/slugify"

/** docs/product.md §5.3 — "Paginated at 10 posts". */
export const PAGE_SIZE = 10

const metaSchema = z.object({
  title: z.string().min(1),
  /** One sentence. Feeds the list card and the page description. */
  summary: z.string().min(1),
  /**
   * ISO date, and the sort key. A regex rather than a coerced Date because the
   * string is also what reaches `<time dateTime>`, and "2026-8-4" would parse
   * happily while sorting wrong.
   */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  author: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
})

/**
 * The whole module, not just `meta` — `@types/mdx` declares "*.mdx" with a
 * single `default` export and nothing else, so checking `default` here costs
 * one line and means a cast never has to exist. See content/case-studies.ts.
 */
const moduleSchema = z.object({
  default: z.custom<ComponentType>((value) => typeof value === "function", {
    message: "no default export — the MDX body is missing",
  }),
  meta: metaSchema,
})

export type PostMeta = z.infer<typeof metaSchema>

/** One outline row. `depth` is 2 or 3 — h2 and h3 only, per §5.3. */
export type TocEntry = { depth: 2 | 3; text: string; id: string }

export type PostSummary = {
  slug: string
  meta: PostMeta
  readingMinutes: number
}

export type PostLink = { slug: string; title: string }

export type Post = PostSummary & {
  /** The compiled MDX body. Rendered inside the page's prose container. */
  Body: ComponentType
  toc: readonly TocEntry[]
  /** Neighbours in the newest-first order. SAME PERSONA ONLY (§2.3). */
  newer: PostLink | undefined
  older: PostLink | undefined
}

type Loader = () => Promise<unknown>

/*
  A STATIC MAP, NOT A GLOB — same reasoning as content/case-studies.ts:
  dynamicParams = false means the slug set has to be known at build time
  anyway, and an explicit map makes an unregistered file a visible omission
  instead of a silent publish.
*/
const swe: Record<string, Loader> = {
  "post-01": () => import("./blog/swe/post-01.mdx"),
  "post-02": () => import("./blog/swe/post-02.mdx"),
  "post-03": () => import("./blog/swe/post-03.mdx"),
  "post-04": () => import("./blog/swe/post-04.mdx"),
  "post-05": () => import("./blog/swe/post-05.mdx"),
  "post-06": () => import("./blog/swe/post-06.mdx"),
  "post-07": () => import("./blog/swe/post-07.mdx"),
  "post-08": () => import("./blog/swe/post-08.mdx"),
  "post-09": () => import("./blog/swe/post-09.mdx"),
  "post-10": () => import("./blog/swe/post-10.mdx"),
  "post-11": () => import("./blog/swe/post-11.mdx"),
  "post-12": () => import("./blog/swe/post-12.mdx"),
}

const posts: Partial<Record<PersonaCode, Record<string, Loader>>> = { swe }

const FENCE = /^```/
const HEADING = /^(#{2,3})\s+(.+?)\s*#*\s*$/
const META_OPEN = /^export const meta\s*=/

/**
 * Outline and word count from one read of the source.
 *
 * Fenced blocks are stripped first, because a `## ` inside a shell sample is
 * not a heading — that alone is why this is a small state machine rather than
 * one regex over the whole file. The `export const meta` block is stripped for
 * the mirror-image reason: it is data, not prose, and counting it inflates the
 * reading time.
 */
function analyze(source: string): { toc: TocEntry[]; words: number } {
  const toc: TocEntry[] = []
  let words = 0
  let inFence = false
  let inMeta = false
  let depth = 0

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()

    if (FENCE.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    if (!inMeta && META_OPEN.test(line)) {
      inMeta = true
      depth = 0
    }
    if (inMeta) {
      depth += (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0)
      if (depth <= 0) inMeta = false
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      const text = heading[2] ?? ""
      toc.push({ depth: heading[1]?.length === 3 ? 3 : 2, text, id: slugify(text) })
      continue
    }

    words += line.split(/\s+/).filter(Boolean).length
  }

  return { toc, words }
}

function sourcePath(code: PersonaCode, slug: string): string {
  return path.join(process.cwd(), "content", "blog", code, `${slug}.mdx`)
}

/** 200 wpm, the conventional figure. Never 0 — "0 min read" reads as broken. */
function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200))
}

/**
 * Every post for one persona, newest first. THE canonical order: pagination,
 * prev/next and generateStaticParams all index into this one array, so no
 * route re-sorts and none of them can disagree about what "the next post" is.
 *
 * Sorting on the ISO date string is a plain lexicographic compare, which is
 * why metaSchema pins the format. Ties break on slug so the order is total.
 *
 * Cached per persona: `next build` calls this once per generated page, and
 * without the cache that is 14 passes over the same twelve files.
 */
const cache = new Map<PersonaCode, readonly PostSummary[]>()

async function summarize(code: PersonaCode): Promise<readonly PostSummary[]> {
  const cached = cache.get(code)
  if (cached) return cached

  const entries = posts[code]
  if (!entries) return []

  const list = await Promise.all(
    Object.keys(entries).map(async (slug) => {
      const { meta } = await loadModule(code, slug)
      const { words } = analyze(readFileSync(sourcePath(code, slug), "utf8"))
      return { slug, meta, readingMinutes: readingMinutes(words) }
    }),
  )

  list.sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.slug.localeCompare(b.slug))
  cache.set(code, list)
  return list
}

/**
 * A validation failure THROWS, it is not `undefined` — a 404 for a file that
 * exists but is malformed would hide the bug at exactly the moment the build
 * could have caught it. The only caller that can legitimately not find a post
 * is `getPost`, and it checks the loader map before getting here.
 */
async function loadModule(
  code: PersonaCode,
  slug: string,
): Promise<{ meta: PostMeta; Body: ComponentType }> {
  const load = posts[code]?.[slug]
  if (!load) throw new Error(`content/blog/${code}/${slug}.mdx is not registered in content/blog.ts`)

  const parsed = moduleSchema.safeParse(await load())
  if (!parsed.success) {
    throw new Error(
      `Invalid blog post in content/blog/${code}/${slug}.mdx:\n` +
        parsed.error.issues
          .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n"),
    )
  }

  return { meta: parsed.data.meta, Body: parsed.data.default }
}

/** Newest-first slugs. Empty for a persona with no posts — the `?? []` idiom. */
export async function getPostSlugs(code: PersonaCode): Promise<readonly string[]> {
  return (await summarize(code)).map((post) => post.slug)
}

/** Total pages, minimum 1 — a persona with no posts still has an empty page 1. */
export async function getPageCount(code: PersonaCode): Promise<number> {
  return Math.max(1, Math.ceil((await summarize(code)).length / PAGE_SIZE))
}

/** 1-based. Out of range yields an empty array; the routes never ask. */
export async function getPostPage(
  code: PersonaCode,
  page: number,
): Promise<readonly PostSummary[]> {
  return (await summarize(code)).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
}

/**
 * `undefined` for an unknown persona or slug, which the route turns into
 * `notFound()`. Never a redirect: §2.6 — a redirect confirms that valid
 * addresses exist and rewards probing.
 *
 * newer/older are neighbours in the newest-first order and are scoped to this
 * persona by construction: `summarize` only ever reads one code's map, so
 * there is no cross-persona link available to emit by mistake (§2.3).
 */
export async function getPost(code: PersonaCode, slug: string): Promise<Post | undefined> {
  if (!posts[code]?.[slug]) return undefined

  const { meta, Body } = await loadModule(code, slug)
  const { toc, words } = analyze(readFileSync(sourcePath(code, slug), "utf8"))

  const ordered = await summarize(code)
  const index = ordered.findIndex((post) => post.slug === slug)
  const link = (post: PostSummary | undefined): PostLink | undefined =>
    post ? { slug: post.slug, title: post.meta.title } : undefined

  return {
    slug,
    meta,
    readingMinutes: readingMinutes(words),
    Body,
    toc,
    newer: link(ordered[index - 1]),
    older: link(ordered[index + 1]),
  }
}
