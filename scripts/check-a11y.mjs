/**
 * Accessibility gate — docs/design-system.md §7
 *
 * §7 has said "`axe` runs in CI, zero critical or serious violations" since M0.
 * Until this file, nothing ran. Six milestones of markup were checked by hand,
 * once each, at the moment they were written.
 *
 * Every route shape, in both themes. Fails the build on `critical` or
 * `serious`; `moderate` and `minor` are counted and printed but not gated,
 * because §7 names that floor and inventing a stricter one here would put the
 * gate and the doc into disagreement.
 *
 * WHY axe-core DIRECTLY AND NOT @axe-core/playwright: the wrapper depends on
 * @playwright/test, and this repo deliberately uses bare `playwright` with
 * hand-rolled assertions (see tests/persona.mjs). One dependency for one
 * `addScriptTag` is not worth pulling a second test framework in behind it.
 *
 * Prerequisite: a served production build on BASE_URL (default :3000).
 * Run: npm run check:a11y
 */
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

import { chromium } from "playwright"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ORIGIN = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const AXE = resolve(root, "node_modules/axe-core/axe.min.js")

/**
 * Built persona. Hardcoded, not imported from content/personas.ts — the rule
 * that file's own docblock sets out, and the one tests/persona.mjs:23 states:
 * a check that reads the same source as the code under test cannot catch that
 * source being wrong.
 */
const BUILT = "swe"

if (!existsSync(AXE)) {
  console.error("axe-core is not installed. Run `npm ci`.")
  process.exit(1)
}

const home = await fetch(ORIGIN + "/").catch(() => null)
if (!home?.ok) {
  console.error(
    "\nNo server at " + ORIGIN + " — run `npm run build` then `npx next start` first.",
  )
  process.exit(1)
}

/**
 * ROUTES ARE DERIVED FROM SERVED HTML, NOT LISTED.
 *
 * One case-study slug and one post slug are scraped off the pages that link to
 * them, for the reason above. A hardcoded slug list would keep passing after
 * the content module that generates those routes broke.
 */
const personaHtml = await (await fetch(ORIGIN + "/" + BUILT)).text()
const blogHtml = await (await fetch(ORIGIN + "/" + BUILT + "/blog")).text()

const first = (html, kind) => {
  const m = html.match(new RegExp('href="/' + BUILT + "/" + kind + '/([^"/]+)"'))
  return m?.[1]
}
const workSlug = first(personaHtml, "work")
const postSlug = first(blogHtml, "blog")

if (!workSlug || !postSlug) {
  console.error(
    "\nRoute derivation found nothing — work:" + workSlug + " post:" + postSlug + "\n" +
      "An empty sweep passes vacuously, so this is a hard stop rather than a skip.",
  )
  process.exit(1)
}

/** The seven distinct route shapes the site serves. */
const ROUTES = [
  ["homepage", "/"],
  ["persona", "/" + BUILT],
  ["case study", "/" + BUILT + "/work/" + workSlug],
  ["blog list", "/" + BUILT + "/blog"],
  ["blog page 2", "/" + BUILT + "/blog/page/2"],
  ["post", "/" + BUILT + "/blog/" + postSlug],
  ["404", "/nope"],
]

let failed = 0
let checked = 0
const browser = await chromium.launch()

for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({ colorScheme: theme })
  /* Same seeding as tests/homepage.mjs's keyboard group — the pre-paint script
     reads localStorage, so setting it before navigation avoids a toggle click
     and the transition settle that would come with it. */
  await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme)

  for (const [label, path] of ROUTES) {
    const page = await ctx.newPage()
    await page.goto(ORIGIN + path, { waitUntil: "networkidle" })

    /* Reveal animations gate on mount and settle within 400ms. Running axe
       mid-reveal reports elements as hidden that are about to be visible. */
    await page.waitForTimeout(500)
    await page.addScriptTag({ path: AXE })

    const results = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        resultTypes: ["violations"],
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      })
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        count: v.nodes.length,
        target: String(v.nodes[0]?.target?.[0] ?? "").slice(0, 70),
      }))
    })
    await page.close()
    checked++

    const blocking = results.filter((v) => v.impact === "critical" || v.impact === "serious")
    const minor = results.filter((v) => v.impact !== "critical" && v.impact !== "serious")
    const name = `${theme.padEnd(5)} ${label}`

    if (blocking.length > 0) {
      failed++
      console.error(`FAIL  ${name}`)
      for (const v of blocking) {
        console.error(`        ${v.impact}  ${v.id}  ×${v.count}  ${v.target}`)
      }
    } else {
      const tail = minor.length > 0 ? `  (${minor.length} moderate/minor, not gated)` : ""
      console.log(`ok    ${name}${tail}`)
    }
    for (const v of minor) console.log(`        · ${v.impact}  ${v.id}  ×${v.count}`)
  }
  await ctx.close()
}
await browser.close()

/* An empty sweep would otherwise report success — the vacuous-pass failure M5
   turned up, where a check that matched nothing reported that nothing was
   wrong. The route count is the assertion that this one ran. */
const EXPECTED = ROUTES.length * 2
if (checked !== EXPECTED) {
  console.error(`\nSwept ${checked} route/theme pairs, expected ${EXPECTED}.`)
  process.exit(1)
}

if (failed > 0) {
  console.error(`\n${failed} of ${checked} route/theme pairs have critical or serious violations.`)
  process.exit(1)
}
console.log(`\nNo critical or serious violations across ${checked} route/theme pairs.`)
