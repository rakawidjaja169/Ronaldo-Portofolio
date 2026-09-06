/**
 * Homepage verification — M1 acceptance, M7 groundwork.
 *
 * Covers the checks docs/design-system.md §7 and docs/product.md §9 make
 * non-negotiable: content renders without JS, reduced motion is a resting
 * state rather than a fast one, the theme survives a reload without a flash,
 * every control carries the accent focus ring, and nothing overflows.
 *
 * Plain Node + Playwright, no runner. M7 folds this into the real suite
 * alongside axe-core and the isolation assertions; until then it stays
 * runnable on its own so M1 has an executable acceptance record rather than
 * a paragraph claiming one.
 *
 *   npm run build && npx next start
 *   node tests/homepage.mjs
 *
 * `npx next start`, NOT `npm start`. next.config.mjs sets output "standalone"
 * and next start prints a warning saying the two do not work together —
 * measured, they do: every route here is prerendered, so nothing depends on
 * the standalone runtime. The alternative, node .next/standalone/server.js,
 * first needs .next/static and public/ copied in beside it. CI runs the
 * command written above.
 */
import { existsSync } from "node:fs"

import { chromium } from "playwright"

const URL = process.env.BASE_URL ?? "http://localhost:3000/"

/** --accent, #FF914D — design-system.md §1.1. Identical in both themes. */
const ACCENT_RGB = "rgb(255, 145, 77)"

/*
  Reachability, unconditionally — the guard below is skipped for a foreign
  origin, and without this a typo'd BASE_URL would surface as thirty confusing
  assertion failures instead of one clear line.
*/
{
  const res = await fetch(URL).catch(() => null)
  if (!res?.ok) {
    console.error(
      "\nNo server at " + URL + " — run `npm run build && npx next start` first.",
    )
    process.exit(1)
  }
}

/*
  Fail fast if the running server is not the build on disk.

  A stale `npx next start` left on :3000 keeps answering 200 while serving a .next
  that has since been overwritten — layout is silently wrong (a 44px control
  measures 36px, an image fills the viewport) and every assertion below then
  reports on a page that no longer exists. This has cost two debugging
  detours.

  THE CHARACTER CLASS EXCLUDES A BACKSLASH, AND THAT IS THE WHOLE FIX.
  The RSC flight payload embeds the same asset URLs a second time inside a
  JSON string, so the source text contains \" as the closing delimiter.
  Without \ in the class the match runs one character too far and yields
  ".../x.woff2\", which existsSync on Windows resolves anyway (a trailing
  separator is tolerated) and on Linux does not. The guard therefore passed
  locally for six milestones and failed the first CI run it was ever part of,
  reporting "4 of 17 assets absent" against a build that was entirely present.

  IT ONLY RUNS WHEN BASE_URL IS UNSET, AND THAT IS THE POINT. It compares
  served assets against this checkout's .next, so it is only meaningful when
  the origin IS this checkout's build — the `npx next start` workflow, which is
  what CI runs. Against any other origin the comparison is category-wrong: a
  container or a deployed site serves a different build, so every hashed asset
  is legitimately absent from the local .next and the guard reports a stale
  server against a perfectly healthy one. Presence of BASE_URL — not its value
  — is the only available signal, since the default and an explicit
  localhost:3000 are the same string.

  Fingerprint is asset existence, not a build id: the App Router does not
  emit one into the HTML, but a stale server references hashed chunks that
  are no longer on disk, which is exactly the condition worth failing on.
*/
if (!process.env.BASE_URL) {
  const res = await fetch(URL).catch(() => null)
  if (!res?.ok) {
    console.error("\nNo server at " + URL + " — run `npm run build && npx next start` first.")
    process.exit(1)
  }
  const assets = [...new Set((await res.text()).match(/\/_next\/static\/[^"'\\]+/g) ?? [])]
  const missing = []
  for (const a of assets) {
    const onDisk = ".next" + a.replace("/_next", "").split("?")[0]
    if (!existsSync(onDisk)) missing.push(a)
  }
  if (assets.length > 0 && missing.length > 0) {
    console.error(
      "\nStale server: " + missing.length + " of " + assets.length +
        " served assets are absent from .next — e.g. " + missing[0] + "\n" +
        "Kill the process on :3000 and restart `npx next start`.",
    )
    process.exit(1)
  }
}

const fail = []
const ok = (c, m) => (c ? console.log("  PASS " + m) : (fail.push(m), console.log("  FAIL " + m)))

/*
  1. JS disabled — product.md §9.6.

  Asserts computed opacity, not DOM presence. The bug this exists to catch
  shipped every node in the server HTML and still painted a blank page:
  Framer Motion serializes `initial` into SSR markup as an inline
  `opacity:0`, so a text-extraction check passes while a human sees nothing.
*/
{
  const b = await chromium.launch()
  const ctx = await b.newContext({ javaScriptEnabled: false })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: "load" })
  console.log("\n[JS disabled]")
  for (const [label, sel] of [
    ["headline", "h1"],
    ["positioning", "p:has-text('Software engineer')"],
    ["contact list", "ul"],
    ["footer", "footer p"],
    ["portrait", "img"],
  ]) {
    const el = p.locator(sel).first()
    const visible = await el.isVisible().catch(() => false)
    const op = visible ? await el.evaluate((n) => getComputedStyle(n).opacity) : "0"
    ok(visible && Number(op) > 0.99, `${label} visible (opacity ${op})`)
  }
  const h1 = await p.locator("h1").innerText()
  ok(h1.includes("Ronaldo") && h1.includes("Katriel"), `h1 text = ${JSON.stringify(h1)}`)
  await b.close()
}

/*
  2. Reduced motion — design-system.md §4.4: content renders at rest, not
  animated quickly. Both opacity and transform must already be resolved.
*/
{
  const b = await chromium.launch()
  const ctx = await b.newContext({ reducedMotion: "reduce" })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: "networkidle" })
  console.log("\n[prefers-reduced-motion: reduce]")
  const states = await p.evaluate(() =>
    [...document.querySelectorAll("h1 span span, .animate-rise-in")].map((n) => ({
      op: getComputedStyle(n).opacity,
      tf: getComputedStyle(n).transform,
    })),
  )
  ok(states.length > 0, `${states.length} animated elements found`)
  ok(states.every((s) => Number(s.op) > 0.99), "all opaque")
  ok(states.every((s) => s.tf === "none" || s.tf === "matrix(1, 0, 0, 1, 0, 0)"), "all untransformed")
  await b.close()
}

/* 3. Theme — dark by default, choice persists, no flash on reload. */
{
  const b = await chromium.launch()
  const ctx = await b.newContext({ colorScheme: "dark" })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: "networkidle" })
  console.log("\n[theme]")
  ok((await p.locator("html").getAttribute("data-theme")) === "dark", "defaults to dark")

  const toggle = p.getByRole("button").first()
  ok(!!(await toggle.getAttribute("aria-label")), "toggle has aria-label")
  await toggle.click()
  await p.waitForTimeout(200)
  ok((await p.locator("html").getAttribute("data-theme")) === "light", "toggles to light")

  // `commit` resolves before first paint — if data-theme is right here, the
  // pre-paint script beat the render and there is no flash to see.
  await p.reload({ waitUntil: "commit" })
  const atCommit = await p.evaluate(() => document.documentElement.getAttribute("data-theme"))
  ok(atCommit === "light", `no flash: data-theme is "${atCommit}" before paint`)

  /*
    The other direction, which the reload above cannot prove: with no stored
    choice the default is dark, and it stays dark even when the OS asks for
    light. The first assertion runs in this dark-scheme context, so it would
    pass either way — it is setup. The second one, under
    `prefers-color-scheme: light`, is the assertion: a matchMedia fallback
    creeping into the pre-paint script produces "light" there and fails.
  */
  await p.evaluate(() => localStorage.removeItem("theme"))
  await p.reload({ waitUntil: "commit" })
  ok(
    (await p.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark",
    "cleared storage: back to the dark default",
  )
  await ctx.close()

  const lightCtx = await b.newContext({ colorScheme: "light" })
  const lp = await lightCtx.newPage()
  /*
    `domcontentloaded`, not `commit`. `commit` resolves as soon as the
    navigation is committed, which on a cold context can land BEFORE the
    inline <head> script has run — the attribute reads null and the assertion
    fails for a reason that has nothing to do with the theme. The no-flash
    check above can use `commit` because it reloads a warm page. What matters
    here is only that the value is settled before hydration, and
    domcontentloaded is that point.
  */
  await lp.goto(URL, { waitUntil: "domcontentloaded" })
  ok(
    (await lp.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark",
    "dark default holds under prefers-color-scheme: light",
  )
  await b.close()
}

/* 4. Keyboard order + focus ring, both themes — design-system.md §7. */
for (const theme of ["dark", "light"]) {
  const b = await chromium.launch()
  const ctx = await b.newContext()
  await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme)
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: "networkidle" })
  console.log(`\n[keyboard · ${theme}]`)

  const order = []
  for (let i = 0; i < 5; i++) {
    await p.keyboard.press("Tab")
    /*
      Settle past the 150ms transition before reading the ring. The contact
      anchors carry `transition-colors`, and Tailwind's transition-property
      list includes `outline-color` — sampled at t=0 the outline still reads
      currentColor, which is indistinguishable from a missing accent ring.
    */
    await p.waitForTimeout(250)
    order.push(
      await p.evaluate(() => {
        const a = document.activeElement
        if (!a) return { label: "none" }
        const s = getComputedStyle(a)
        return {
          label: `${a.tagName.toLowerCase()}:${(a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 28)}`,
          w: s.outlineWidth,
          st: s.outlineStyle,
          c: s.outlineColor,
          off: s.outlineOffset,
        }
      }),
    )
  }
  order.forEach((o, i) => console.log(`    ${i + 1}. ${o.label}  [${o.w} ${o.st} ${o.c} / ${o.off}]`))

  ok(order[0].label.startsWith("a:Skip to content"), "skip link is first")
  const bad = order.filter(
    (o) => !(o.st === "solid" && parseFloat(o.w) >= 2 && o.c === ACCENT_RGB && parseFloat(o.off) >= 2),
  )
  ok(bad.length === 0, `all ${order.length} controls: 2px solid ${ACCENT_RGB} @ 2px offset`)
  await b.close()
}

/* 5. Responsive — no horizontal scroll at any breakpoint. */
{
  const b = await chromium.launch()
  console.log("\n[responsive]")
  for (const w of [375, 768, 1440]) {
    const p = await b.newPage()
    await p.setViewportSize({ width: w, height: 900 })
    await p.goto(URL, { waitUntil: "networkidle" })
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    const box = await p.locator("img").first().boundingBox()
    ok(overflow <= 0, `${w}px: no horizontal scroll (overflow ${overflow}px)`)
    console.log(`    ${w}px portrait ${Math.round(box.width)}x${Math.round(box.height)}`)
    await p.close()
  }
  await b.close()
}

/*
  6. Isolation, homepage side — product.md §2.1.

  tests/persona.mjs proves a persona route never links out. NOTHING HAS EVER
  PROVEN THE HOMEPAGE DOES NOT LINK IN, and that is the same guarantee read
  from the other end: one `<a href="/swe">` in a footer defeats §2 exactly as
  completely as a persona linking home does.

  CODES ARE HARDCODED, not imported from content/personas.ts — the rule that
  file's own docblock sets out and tests/persona.mjs:23 states: a check that
  reads the same source as the code under test cannot catch that source being
  wrong. The cost is that a sixth code added there is invisible here, which is
  the trade this repo has already made everywhere else it hardcodes "swe".

  Every href is resolved through `a.href` before its first segment is read, so
  a relative "swe", a "./swe" and an absolute URL all normalise first.
*/
{
  const CODES = ["swe", "cst", "cc", "pm", "dsn"]
  const b = await chromium.launch()
  const p = await b.newPage()
  await p.goto(URL, { waitUntil: "networkidle" })
  console.log("\n[isolation · homepage]")

  /* `seg` is computed IN THE PAGE, not here: this module's own `URL` const is
     the base address under test and shadows the global URL constructor, so
     `new URL(...)` in Node scope is a TypeError. The anchor element has
     already resolved the href for us anyway — a.pathname is the answer. */
  const links = await p.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => ({
      raw: a.getAttribute("href"),
      seg: a.pathname.split("/").filter(Boolean)[0] ?? null,
      sameOrigin: a.origin === location.origin,
      text: (a.textContent ?? "").trim().slice(0, 40),
    })),
  )
  /* An empty page passes every filter below. This is the assertion that the
     sweep ran at all — the vacuous-pass failure M5 turned up once already. */
  ok(links.length > 0, links.length + " links found")

  const leaks = links.filter((l) => l.sameOrigin && l.seg !== null && CODES.includes(l.seg))
  for (const l of leaks) console.log(`    leak: ${l.raw}  "${l.text}"`)
  ok(leaks.length === 0, "no link on / resolves to a persona route")

  /* And against the served markup, which the DOM sweep cannot see: a persona
     path sitting in a data attribute, a JSON-LD block or a preload hint is not
     an anchor, is not clickable, and is still the address written down. */
  const html = await (await fetch(URL)).text()
  const inHtml = CODES.filter((c) => new RegExp('/' + c + '(?:[/"#?])').test(html))
  ok(inHtml.length === 0, "no persona path in the served HTML" + (inHtml.length ? ": " + inHtml : ""))

  await b.close()
}

console.log(fail.length ? `\n${fail.length} FAILURES:\n  ` + fail.join("\n  ") : "\nAll checks passed.")
process.exit(fail.length ? 1 : 0)
