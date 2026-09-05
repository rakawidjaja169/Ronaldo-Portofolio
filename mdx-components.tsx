import { type ComponentPropsWithoutRef, type JSX, type ReactNode } from "react"
import type { MDXComponents } from "mdx/types"

import { Callout } from "@/components/persona/callout"
import { slugify } from "@/lib/slugify"

/**
 * MDX element mapping — docs/design-system.md §2.1, §2.2.
 *
 * REQUIRED AT THE REPO ROOT with this exact name. `@next/mdx` resolves it by
 * path, not by import; moving it silently drops every style below and the case
 * studies render as unstyled browser defaults.
 *
 * NO @tailwindcss/typography. The repo already has nine type tokens and a
 * `.prose` reset would fight all of them — two scales, and the one that wins
 * depends on specificity rather than on a decision.
 *
 * EVERY HEADING NEEDS AN EXPLICIT SIZE. `@layer base` in globals.css gives
 * h1–h6 `font-display`, weight 600, and `text-wrap: balance`, but deliberately
 * no size. An unclassed `## ` here would inherit the body size and read as
 * bold prose rather than as a heading.
 *
 * h2/h3 GET IDS FROM lib/slugify.ts, and content/blog.ts builds the post
 * outline with the same call on the same heading text — one function, so an
 * outline link and its heading cannot drift apart. Do not add rehype-slug: it
 * would compute the same ids in a second pipeline the outline cannot see.
 * The constraint that comes with it is plain-text headings only (see the
 * slugify docblock); `[blog · outline]` in tests/persona.mjs enforces it by
 * comparing every rendered id against every outline href.
 *
 * `scroll-mt-24` on both, so a deep link parks the heading below the fixed nav
 * rather than underneath it — the same value Section already uses.
 *
 * h1 IS ABSENT ON PURPOSE. The case-study page renders the title as the
 * document's only h1; an author writing `# ` in the body would produce a
 * second one and break the §7 heading order. Left unmapped, it still renders —
 * as an unsized h1, which is visible enough to get fixed.
 */
type Props<T extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<T>

/**
 * Flattens heading children to a string. Plain text and nested arrays only —
 * anything else (inline code, a link) yields "" for that part and the id stops
 * matching what content/blog.ts derived from the raw markdown, which is the
 * documented ceiling on slugify rather than a bug to patch here.
 */
function toText(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(toText).join("")
  return ""
}

/* Not a hook despite the name — the name is the @next/mdx contract. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }: Props<"h2">) => (
      <h2 id={slugify(toText(children))} className="mt-14 scroll-mt-24 text-h2" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: Props<"h3">) => (
      <h3 id={slugify(toText(children))} className="mt-8 scroll-mt-24 text-h3" {...props}>
        {children}
      </h3>
    ),

    p: (props: Props<"p">) => <p className="mt-5 text-body-l text-ink-muted" {...props} />,

    /*
      `marker:` colours the bullet without the ::before hack, so the list item
      stays a real list item for a screen reader. `ps-6` not `pl-6`: the marker
      hangs on the inline-start edge, which flips with the writing direction.
    */
    ul: (props: Props<"ul">) => (
      <ul
        className="mt-5 list-disc space-y-2 ps-6 text-body-l text-ink-muted marker:text-accent"
        {...props}
      />
    ),
    ol: (props: Props<"ol">) => (
      <ol
        className="mt-5 list-decimal space-y-2 ps-6 text-body-l text-ink-muted marker:font-mono marker:text-accent"
        {...props}
      />
    ),
    li: (props: Props<"li">) => <li className="ps-1" {...props} />,

    /*
      An MDX link is external unless it starts with "/" or "#". `noreferrer`
      implies `noopener` in every browser that ships this parser, so one
      keyword is enough — and the target only opens a tab for a link that
      genuinely leaves the site.

      No next/link: nothing in a case-study body links within the site today,
      and a plain anchor is what keeps a persona-relative href literal and
      greppable by the [case study · isolation] test.
    */
    a: ({ href = "", ...props }: Props<"a">) => {
      const internal = href.startsWith("/") || href.startsWith("#")
      return (
        <a
          href={href}
          {...(internal ? {} : { target: "_blank", rel: "noreferrer" })}
          className="underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
          {...props}
        />
      )
    },

    blockquote: ({ children }: Props<"blockquote">) => <Callout>{children}</Callout>,

    strong: (props: Props<"strong">) => <strong className="font-semibold text-ink" {...props} />,

    hr: (props: Props<"hr">) => <hr className="mt-12 border-border" {...props} />,

    /*
      `pre` scrolls inside itself. Without the wrapper's own overflow, a long
      line widens the article, which widens the page — a horizontal scrollbar
      on the document is the §5 failure the manual 375px pass looks for.

      The nested `code` drops its own chrome: it inherits the block's padding
      and background, and doubling them draws a box inside a box.
    */
    pre: (props: Props<"pre">) => (
      <pre
        className="mt-6 overflow-x-auto rounded-md border border-border bg-surface p-5 font-mono text-body-s [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit"
        {...props}
      />
    ),
    code: (props: Props<"code">) => (
      <code
        className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-body-s text-ink"
        {...props}
      />
    ),

    /* Caller-supplied overrides win — the @next/mdx contract. */
    ...components,
  }
}
