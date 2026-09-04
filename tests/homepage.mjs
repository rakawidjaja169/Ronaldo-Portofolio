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
 *   npm run build && npm start
 *   node tests/homepage.mjs
 */
import { existsSync } from "node:fs"

import { chromium } from "playwright"

const URL = process.env.BASE_URL ?? "http://localhost:3000/"

/** --accent, #FF914D — design-system.md §1.1. Identical in both themes. */
const ACCENT_RGB = "rgb(255, 145, 77)"

/*
  Fail fast if the running server is not the build on disk.

  A stale `npm start` left on :3000 keeps answering 200 while serving a .next
  that has since been overwritten — layout is silently wrong (a 44px control
  measures 36px, an image fills the viewport) and every assertion below then
  reports on a page that no longer exists. This has cost two debugging
  detours.

  Fingerprint is asset existence, not a build id: the App Router does not
  emit one into the HTML, but a stale server references hashed chunks that
  are no longer on disk, which is exactly the condition worth failing on.
*/
{
  const res = await fetch(URL).catch(() => null)
  if (!res?.ok) {
    console.error("\nNo server at " + URL + " — run `npm run build && npm start` first.")
    process.exit(1)
  }
  const assets = [...new Set((await res.text()).match(/\/_next\/static\/[^"']+/g) ?? [])]
  const missing = []
  for (const a of assets) {
    const onDisk = ".next" + a.replace("/_next", "").split("?")[0]
    if (!existsSync(onDisk)) missing.push(a)
  }
  if (assets.length > 0 && missing.length > 0) {
    console.error(
      "\nStale server: " + missing.length + " of " + assets.length +
        " served assets are absent from .next — e.g. " + missing[0] + "\n" +
        "Kill the process on :3000 and restart `npm start`.",
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

console.log(fail.length ? `\n${fail.length} FAILURES:\n  ` + fail.join("\n  ") : "\nAll checks passed.")
process.exit(fail.length ? 1 : 0)
