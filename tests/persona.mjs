/**
 * Persona route verification — M2 acceptance, and the isolation test.
 *
 * docs/product.md §2 is the product's defining constraint, so it gets a test
 * rather than a convention. Written now, while the routing abstraction is
 * fresh, per the roadmap sequencing note; M7 folds it into the real suite with
 * @playwright/test and axe.
 *
 * The assertions that matter most are 3 and 4: no anchor on /swe resolves to
 * the homepage or to another persona, and no shipped client chunk names a
 * reserved code. Everything else here is ordinary route acceptance.
 *
 *   npm run build && npm start
 *   node tests/persona.mjs
 */
import { existsSync } from "node:fs"

import { chromium } from "playwright"

const ORIGIN = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const BUILT = "swe"

/**
 * Reserved but unbuilt. These are what must never appear in served output —
 * hardcoded rather than imported from content/personas.ts, because a test that
 * reads the same source as the code under test cannot catch that source being
 * wrong.
 */
const RESERVED = ["cst", "cc", "pm", "dsn"]

/*
  Stale-server guard — same fingerprint as tests/homepage.mjs, and for the same
  reason: a stale `npm start` answers 200 while serving a .next that has been
  overwritten, and every assertion below then reports on a page that no longer
  exists. Asset existence is the fingerprint because the App Router emits no
  build id into the HTML.
*/
{
  const res = await fetch(ORIGIN + "/" + BUILT).catch(() => null)
  if (!res?.ok) {
    console.error("\nNo server at " + ORIGIN + " — run `npm run build && npm start` first.")
    process.exit(1)
  }
  const assets = [...new Set((await res.text()).match(/\/_next\/static\/[^"']+/g) ?? [])]
  /* decodeURIComponent: dynamic segments ship URL-encoded (%5Bpersona%5D),
     and the on-disk path is the literal [persona]. Without this the guard
     reports every persona chunk as missing and blocks on a fresh build. */
  const missing = assets.filter(
    (a) => !existsSync(decodeURIComponent(".next" + a.replace("/_next", "").split("?")[0])),
  )
  if (assets.length > 0 && missing.length > 0) {
    console.error(
      "\nStale server: " +
        missing.length +
        " of " +
        assets.length +
        " served assets are absent from .next — e.g. " +
        missing[0] +
        "\nKill the process on :3000 and restart `npm start`.",
    )
    process.exit(1)
  }
}

const fail = []
const ok = (c, m) => (c ? console.log("  PASS " + m) : (fail.push(m), console.log("  FAIL " + m)))

/* 1. Routing — product.md §2.6. */
console.log("\n[routing]")
{
  const built = await fetch(ORIGIN + "/" + BUILT, { redirect: "manual" })
  ok(built.status === 200, "/" + BUILT + " returns 200")

  /*
    An unknown code must 404, NOT redirect. A redirect confirms that valid
    codes exist and rewards probing, which is the one behavior the isolation
    rule cannot afford. `redirect: "manual"` is what makes this meaningful —
    the default would follow a 302 to / and report 200.
  */
  const unknown = await fetch(ORIGIN + "/xyz", { redirect: "manual" })
  ok(unknown.status === 404, "/xyz returns 404, got " + unknown.status)
  ok(unknown.status < 300 || unknown.status >= 400, "/xyz does not redirect (no Location header)")

  for (const code of RESERVED) {
    const res = await fetch(ORIGIN + "/" + code, { redirect: "manual" })
    ok(res.status === 404, "/" + code + " (reserved, unbuilt) returns 404")
  }
}

const html = await (await fetch(ORIGIN + "/" + BUILT)).text()

/* 2. noindex — product.md §2.4. The entire search-engine exclusion. */
console.log("\n[indexing]")
{
  const meta = html.match(/<meta name="robots" content="([^"]*)"/i)
  ok(meta !== null, "/" + BUILT + " emits a robots meta tag")
  ok(/noindex/i.test(meta?.[1] ?? ""), "robots meta contains noindex — got: " + meta?.[1])
  ok(/nofollow/i.test(meta?.[1] ?? ""), "robots meta contains nofollow")

  const robots = await (await fetch(ORIGIN + "/robots.txt")).text()
  ok(!/Disallow:\s*\/\w/i.test(robots), "robots.txt has no persona Disallow (§2.4)")
  ok(
    ![BUILT, ...RESERVED].some((c) => new RegExp("/" + c + "\\b").test(robots)),
    "robots.txt names no persona code",
  )

  const sitemap = await (await fetch(ORIGIN + "/sitemap.xml")).text()
  ok(
    ![BUILT, ...RESERVED].some((c) => new RegExp("/" + c + "\\b").test(sitemap)),
    "sitemap.xml names no persona code",
  )
}

/*
  3. THE ISOLATION ASSERTION — product.md §2.1–2.3.

  No anchor on a persona page may resolve to the homepage or to another
  persona. Resolved against the origin rather than matched as a string, so a
  relative href like "../" is caught the same as a literal "/".
*/
console.log("\n[isolation · links]")
{
  const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1])
  ok(hrefs.length > 0, "found " + hrefs.length + " hrefs to check")

  const pageUrl = ORIGIN + "/" + BUILT
  const offending = []
  for (const href of hrefs) {
    if (/^(mailto:|tel:|#)/.test(href)) continue
    let resolved
    try {
      resolved = new URL(href, pageUrl)
    } catch {
      continue
    }
    if (resolved.origin !== ORIGIN) continue // external, fine

    const path = resolved.pathname.replace(/\/$/, "")
    if (path === "") offending.push(href + " -> homepage")
    const first = path.split("/")[1]
    if (first && first !== BUILT && RESERVED.includes(first)) {
      offending.push(href + " -> persona " + first)
    }
  }
  ok(
    offending.length === 0,
    "no anchor resolves to / or another persona" +
      (offending.length ? ": " + offending.join(", ") : ""),
  )
}

/*
  4. THE ISOLATION ASSERTION, part two — the reserved codes must not reach the
  browser at all.

  content/personas.ts names every reserved code. Importing it from a client
  component would inline that list into a chunk, publishing the enumeration in
  a file anyone can read. This is why PersonaNav takes sections as props.
*/
console.log("\n[isolation · bundle]")
{
  const chunks = [...new Set(html.match(/\/_next\/static\/[^"']+\.js/g) ?? [])]
  ok(chunks.length > 0, "found " + chunks.length + " client chunks to scan")

  const leaked = []
  for (const chunk of chunks) {
    const body = await (await fetch(ORIGIN + chunk)).text()
    for (const code of RESERVED) {
      // Quoted, as it would appear in an inlined array of codes.
      if (new RegExp("[\"'`]" + code + "[\"'`]").test(body)) leaked.push(code + " in " + chunk)
    }
  }
  ok(
    leaked.length === 0,
    "no reserved code in any client chunk" + (leaked.length ? ": " + leaked.join(", ") : ""),
  )
}

/* 5. Content renders without JS — product.md §9.6. */
console.log("\n[no javascript]")
{
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "load" })

  /*
    Computed opacity, not DOM presence — the failure this guards against ships
    every node in the HTML and still paints blank, because Framer serializes
    `initial` into SSR markup as inline opacity:0.
  */
  const h1 = page.locator("h1")
  ok((await h1.count()) === 1, "exactly one h1")
  ok(await h1.isVisible(), "headline is visible")
  ok((await h1.evaluate((el) => getComputedStyle(el).opacity)) === "1", "headline opacity is 1")

  const cta = page.locator('main a[href^="#"]').first()
  ok(await cta.isVisible(), "hero CTA is visible")

  for (const id of ["work", "experience", "skills", "contact"]) {
    ok((await page.locator("#" + id).count()) === 1, "section #" + id + " exists")
  }

  /*
    `/swe#work`, not `#work`. The nav takes a basePath as of M4 because it also
    wraps the case studies, where a bare fragment resolves inside the case study
    and goes nowhere; on /swe itself the persona-absolute form is still a
    same-document fragment, so the browser scrolls in place either way.
  */
  const navLinks = await page.locator('header nav a[href*="#"]').count()
  ok(navLinks > 0, "nav anchors render without JS (" + navLinks + ")")

  /*
    Section headings, below the fold and wrapped in Reveal. This caught a real
    M2 bug: Framer serializes `initial` into SSR markup as inline opacity:0, so
    every heading shipped permanently invisible with JS off. Reading the h2's
    own opacity would have missed it — the hiding style sits on Reveal's
    wrapper, which is the h2's PARENT. Read the parent.
  */
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("main h2")]
      .filter((h) => getComputedStyle(h.parentElement).opacity !== "1")
      .map((h) => h.textContent.trim()),
  )
  ok(
    hidden.length === 0,
    "section headings are opaque without JS" + (hidden.length ? ": " + hidden.join(", ") : ""),
  )

  await browser.close()
}

/*
  5b. Reduced motion — §4.4 makes "renders plainly" a first-class path, not a
  degradation. Same wrapper-opacity trap as above: the plain branch must not
  leave the server's hiding style behind.
*/
console.log()
console.log("[reduced motion]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ reducedMotion: "reduce" })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(600)

  const faded = await page.evaluate(() =>
    [...document.querySelectorAll("main h2, main h1")]
      .filter((h) => getComputedStyle(h.parentElement).opacity !== "1")
      .map((h) => h.textContent.trim()),
  )
  ok(
    faded.length === 0,
    "all headings opaque under reduced motion" + (faded.length ? ": " + faded.join(", ") : ""),
  )
  ok((await page.locator("canvas").count()) === 0, "no canvas mounts (§5 — poster only)")

  await browser.close()
}

/* 6. Keyboard and focus ring — design-system.md §7. */
console.log("\n[keyboard]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })

  await page.keyboard.press("Tab")
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "")
  ok(first.startsWith("Skip to content"), "skip link is first — got: " + first)

  await page.keyboard.press("Tab")
  const second = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    href: document.activeElement?.getAttribute("href"),
  }))
  /* The logo scrolls to top; it must not be a link to "/" — §2.1. */
  ok(second.tag === "BUTTON", "logo is a button, not a link — got " + second.tag)
  ok(second.href === null, "logo has no href")

  /*
    Settle past the 150ms transition before reading the ring: Tailwind's
    transition-property list includes outline-color, so a sample at t=0 reads
    currentColor and is indistinguishable from a missing accent ring.
  */
  await page.waitForTimeout(250)
  const ring = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement)
    return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor }
  })
  ok(
    ring.style === "solid" && parseFloat(ring.width) >= 2 && ring.color === "rgb(255, 145, 77)",
    "focus ring is 2px solid accent — got " + JSON.stringify(ring),
  )

  await browser.close()
}

/* 7. Mobile sheet — §7 escape route, focus return, scroll lock. */
console.log("\n[mobile sheet]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })

  const trigger = page.locator('button[aria-label="Open navigation menu"]')
  ok(await trigger.isVisible(), "menu trigger visible at 375px")
  ok((await trigger.getAttribute("aria-expanded")) === "false", "aria-expanded starts false")

  await trigger.click()
  const dialog = page.locator('[role="dialog"]')
  ok(await dialog.isVisible(), "sheet opens")
  ok(
    (await page.evaluate(() => getComputedStyle(document.body).overflow)) === "hidden",
    "body scroll is locked",
  )

  await page.keyboard.press("Escape")
  ok(!(await dialog.isVisible()), "Escape closes the sheet")
  ok(
    await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") === "Open navigation menu",
    ),
    "focus returns to the trigger",
  )

  await browser.close()
}

/* 8. No horizontal overflow — §7 (zoom to 200% without horizontal scroll). */
console.log("\n[overflow]")
{
  const browser = await chromium.launch()
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    ok(scrollW <= width + 1, width + "px: no horizontal overflow (scrollWidth " + scrollW + ")")
    await page.close()
  }
  await browser.close()
}

/*
  9. Work grid and lightbox — M3, design-system.md §6, §4.3, §7.

  The empty-filter state is deliberately NOT asserted here. Tags are derived
  from the items themselves, so every chip matches at least one card and the
  empty branch is unreachable through the UI — it exists for a persona whose
  work list is empty. Asserting it would need a fixture route that does not
  exist. Recorded in docs/roadmap.md rather than faked with a test that drives
  React state directly.
*/
console.log("\n[work grid]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })

  const cards = page.locator("#work article")
  const total = await cards.count()
  ok(total > 0, "grid renders " + total + " cards")

  const headings = await page.locator("#work article h3").allTextContents()
  ok(
    headings.length === total && headings.every((t) => t.trim().length > 0),
    "every card has a non-empty title",
  )

  const triggers = page.locator('#work button[aria-label^="View screenshots of "]')
  ok((await triggers.count()) === total, "every card has a labelled gallery trigger")

  /*
    Full keyboard path. Tab from the top rather than calling .focus() — a
    trigger that is reachable programmatically but not by Tab passes the second
    and fails the user.
  */
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator("body").click({ position: { x: 2, y: 2 } })
  let reached = false
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press("Tab")
    reached = await page.evaluate(() =>
      (document.activeElement?.getAttribute("aria-label") ?? "").startsWith("View screenshots of "),
    )
  }
  ok(reached, "a gallery trigger is reachable by Tab")

  const triggerLabel = await page.evaluate(
    () => document.activeElement?.getAttribute("aria-label") ?? "",
  )

  await page.keyboard.press("Enter")
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  ok(await dialog.isVisible(), "Enter on the trigger opens the lightbox")
  ok(
    await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
    "focus lands inside the dialog",
  )
  ok(
    (await page.evaluate(() => getComputedStyle(document.body).overflow)) === "hidden",
    "body scroll is locked while the lightbox is open",
  )

  /*
    The counter only exists with more than one image, and only one project has
    a real set. Skip the arrow assertions rather than assert nothing, so a
    future single-image regression cannot hide behind a silent pass.
  */
  const counter = page.locator('[role="dialog"] p[aria-live="polite"]')
  if ((await counter.count()) === 1) {
    const before = (await counter.textContent())?.trim()
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(120)
    const afterNext = (await counter.textContent())?.trim()
    ok(
      afterNext !== before,
      "ArrowRight advances the counter (" + before + " -> " + afterNext + ")",
    )

    await page.keyboard.press("ArrowLeft")
    await page.waitForTimeout(120)
    ok((await counter.textContent())?.trim() === before, "ArrowLeft returns to " + before)
  } else {
    ok(false, "opened gallery has no counter — expected a multi-image project first in the grid")
  }

  await page.keyboard.press("Escape")
  /*
    Wait for the node to detach, not for a fixed delay. The exit is a ~200ms
    fade, so a hardcoded timeout asserts a boundary rather than the behaviour —
    and lands on the wrong side of it whenever the tween shifts.
  */
  await dialog.waitFor({ state: "detached", timeout: 2000 }).catch(() => {})
  ok((await dialog.count()) === 0, "Escape closes the lightbox")
  ok(
    (await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "")) ===
      triggerLabel,
    "focus returns to the trigger that opened it",
  )
  ok(
    (await page.evaluate(() => getComputedStyle(document.body).overflow)) !== "hidden",
    "body scroll lock is released",
  )

  /* Scrim click closes. The scrim is the aria-hidden sibling, not the panel. */
  await triggers.first().click()
  ok(await dialog.isVisible(), "click opens the lightbox")
  /* Top-left: the panel's own padding, clear of every child — see its onClick. */
  await page.mouse.click(6, 6)
  await page.waitForTimeout(400)
  ok((await dialog.count()) === 0, "scrim click closes the lightbox")

  /*
    Filtering, with layout shift measured across the interaction — two
    assertions, because one number cannot express the criterion.

    Removing five of six cards shortens the grid, so everything below it moves
    up. That is a large shift (measured 0.057) and it is not a defect: it is
    the direct, expected result of a click, which is why the browser marks it
    `hadRecentInput` and excludes it from CLS. Counting it would fail the
    milestone for working correctly.

    What the done-criterion actually forbids is a card's image box collapsing
    or resizing mid-filter, which is what work-grid.tsx's docblock claims the
    fixed `aspect-[16/10]` box prevents. So: real CLS (input-excluded, the
    metric §8 budgets) stays under 0.05, AND the surviving card's image box is
    the same height before and after. The second is what makes the first
    falsifiable.

    Deliberately NOT asserted: that nothing inside a card moves at all. Grid
    rows equalise height, so a card that was stretched to match two siblings
    returns to its natural height when it is alone — measured at 3px, absorbed
    by the `flex-1` outcome line. That is the grid working, not a reflow.
  */
  await page.evaluate(() => {
    window.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value
      }
    }).observe({ type: "layout-shift", buffered: false })
  })

  const imageBoxHeight = () =>
    page.evaluate(() => {
      const box = document.querySelector("#work article div.relative")
      return box ? Math.round(box.getBoundingClientRect().height) : -1
    })
  const boxBefore = await imageBoxHeight()

  const chip = page.locator("#work button[aria-pressed]", { hasText: /^Payments$/i })
  ok((await chip.count()) === 1, "the Payments filter chip exists")
  await chip.click()
  await page.waitForTimeout(700)

  ok((await chip.getAttribute("aria-pressed")) === "true", "clicked chip is aria-pressed")
  const filtered = await cards.count()
  ok(filtered > 0 && filtered < total, "filter narrows " + total + " cards to " + filtered)

  const cls = await page.evaluate(() => window.__cls)
  ok(cls < 0.05, "CLS across the filter interaction is " + cls.toFixed(4) + " (budget 0.05)")

  const boxAfter = await imageBoxHeight()
  ok(
    boxBefore > 0 && boxAfter === boxBefore,
    "card image box holds its height through the filter (" + boxBefore + " -> " + boxAfter + ")",
  )

  const all = page.locator("#work button[aria-pressed]", { hasText: /^All$/i })
  await all.click()
  await page.waitForTimeout(500)
  ok((await cards.count()) === total, "the All chip restores every card")

  await browser.close()
}

/* 10. Work grid without JS — the cards are the section's whole content. */
console.log("\n[work grid · no javascript]")
{
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "load" })

  const cards = page.locator("#work article")
  ok((await cards.count()) > 0, "cards render without JS (" + (await cards.count()) + ")")

  /* Parent opacity, per the M2 trap — the hiding style sits on Reveal's wrapper. */
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("#work article")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.querySelector("h3")?.textContent?.trim() ?? "?"),
  )
  ok(
    hidden.length === 0,
    "cards are opaque without JS" + (hidden.length ? ": " + hidden.join(", ") : ""),
  )

  ok(
    (await page.locator('[role="dialog"]').count()) === 0,
    "no lightbox markup ships with the document",
  )

  await browser.close()
}

/* 11. Work grid under reduced motion — §4.4, and the lightbox still works. */
console.log("\n[work grid · reduced motion]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })
  await page.evaluate(() => document.getElementById("work")?.scrollIntoView())
  await page.waitForTimeout(600)

  const faded = await page.evaluate(() =>
    [...document.querySelectorAll("#work article")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.querySelector("h3")?.textContent?.trim() ?? "?"),
  )
  ok(
    faded.length === 0,
    "cards are opaque under reduced motion" + (faded.length ? ": " + faded.join(", ") : ""),
  )

  await page.locator('#work button[aria-label^="View screenshots of "]').first().click()
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  ok(await dialog.isVisible(), "lightbox opens under reduced motion")
  ok(
    await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
    "focus is trapped under reduced motion",
  )
  await page.keyboard.press("Escape")
  /*
    Detach, not a delay — see the note in [case study · gallery]. The panel exit
    collapses to 0.01s under reduced motion but the BACKDROP fade does not, and
    deliberately so: an opacity cross-fade carries no motion to be sick from,
    which is why lightbox.tsx gates the transform and leaves the fade alone.
    That difference is exactly what a fixed timeout turns into a flake.
  */
  await dialog.waitFor({ state: "detached", timeout: 2000 }).catch(() => {})
  ok((await dialog.count()) === 0, "Escape still closes under reduced motion")

  await browser.close()
}

/* 12. Timeline — product.md §5.1, design-system.md §6, §4.3. */
console.log("\n[timeline]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })

  const list = page.locator("#experience ol").first()
  ok((await list.count()) === 1, "timeline is an <ol> (§6 — the order is the meaning)")

  const entries = page.locator("#experience ol > li")
  const total = await entries.count()
  ok(total > 0, "timeline renders " + total + " entries")

  const roles = await page.locator("#experience ol > li h3").allTextContents()
  ok(
    roles.length === total && roles.every((t) => t.trim().length > 0),
    "every entry has a non-empty <h3> role",
  )

  /* §7 heading order: the section <h2>, then <h3>s. No level skipped. */
  const levels = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "#experience h1, #experience h2, #experience h3, #experience h4",
      ),
    ].map((h) => Number(h.tagName[1])),
  )
  ok(levels[0] === 2, "section opens at <h2>, got h" + levels[0])
  ok(
    levels.every((lvl, i) => i === 0 || lvl - levels[i - 1] <= 1),
    "no heading level is skipped: " + levels.join(","),
  )

  /* §2.2 — tabular figures, so the date column does not jitter between entries. */
  const tabular = await page.evaluate(() => {
    const meta = document.querySelector("#experience ol > li p")
    return meta ? getComputedStyle(meta).fontVariantNumeric : ""
  })
  ok(/tabular-nums/.test(tabular), "entry dates use tabular figures, got: " + tabular)

  /*
    The rail is decoration and must stay out of the accessibility tree — the
    <ol> carries every fact, so a screen reader loses nothing when it is hidden.
  */
  const railHidden = await page.evaluate(() => {
    const ol = document.querySelector("#experience ol")
    return Boolean(ol?.parentElement?.querySelector('[aria-hidden="true"]'))
  })
  ok(railHidden, "rail is aria-hidden")

  /*
    THE RAIL ACTUALLY DRAWS. A rail that never fills passes "a rail exists" and
    still fails the reader, so this reads the fill's transform at the top of the
    section and again past its bottom, and requires the two to differ.
  */
  const railScale = () =>
    page.evaluate(() => {
      const ol = document.querySelector("#experience ol")
      const fill = ol?.parentElement?.querySelector('[aria-hidden="true"] > *')
      return fill ? getComputedStyle(fill).transform : "none"
    })

  await page.evaluate(() => document.getElementById("experience")?.scrollIntoView())
  await page.waitForTimeout(400)
  const atTop = await railScale()
  await page.evaluate(() => {
    const el = document.getElementById("experience")
    if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight)
  })
  await page.waitForTimeout(400)
  const atBottom = await railScale()
  ok(atTop !== atBottom, "rail fill grows with scroll: " + atTop + " -> " + atBottom)

  await browser.close()
}

/* 13. Skills — product.md §5.1, design-system.md §6, §7. */
console.log("\n[skills]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })

  const groups = await page.locator("#skills h3").allTextContents()
  ok(groups.length > 0, "skills renders " + groups.length + " group headings")
  ok(
    groups.every((t) => t.trim().length > 0),
    "every group heading is non-empty: " + groups.join(" · "),
  )

  const chips = page.locator("#skills li")
  const chipCount = await chips.count()
  ok(chipCount > 0, "chips render (" + chipCount + ")")

  /*
    A chip filters nothing in this section. A 44px target that does nothing when
    pressed is a §7 defect, so these must be plain <li> — not buttons, not
    links, not tabbable.
  */
  const interactive = await page.locator("#skills button, #skills a, #skills [tabindex]").count()
  ok(interactive === 0, "no chip is interactive or focusable (" + interactive + " found)")

  await browser.close()
}

/* 14. Contact — product.md §7. Direct links only. */
console.log("\n[contact]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })

  /*
    §7 is "no form, no API route". Asserted page-wide rather than inside
    #contact: "we decided not to add a form" is exactly the kind of decision a
    later commit quietly reverses, and it could reappear anywhere on the page.
  */
  ok((await page.locator("form").count()) === 0, "no <form> anywhere on the page (§7)")
  ok((await page.locator("input, textarea").count()) === 0, "no text inputs anywhere (§7)")

  const count = await page.locator("#contact a").count()
  ok(count > 0, "contact renders " + count + " links")

  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll("#contact a")]
      .filter((a) => (a.getAttribute("aria-label") ?? a.textContent ?? "").trim().length === 0)
      .map((a) => a.getAttribute("href")),
  )
  ok(
    unnamed.length === 0,
    "every contact link has an accessible name" + (unnamed.length ? ": " + unnamed.join(", ") : ""),
  )

  /* §7 floor: 44x44 minimum on every target, footer socials included. */
  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll("#contact a, footer a")].map((a) => {
      const r = a.getBoundingClientRect()
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        label: a.getAttribute("aria-label") ?? a.textContent?.trim(),
      }
    }),
  )
  const small = boxes.filter((b) => b.w < 44 || b.h < 44)
  ok(
    small.length === 0,
    "every contact and footer target is at least 44x44" +
      (small.length ? ": " + small.map((b) => b.label + " " + b.w + "x" + b.h).join(", ") : ""),
  )

  /*
    cv.available is false, so no CV control may render. A download button
    pointing at a 404 is worse than no button.
  */
  ok(
    (await page.locator('a[href^="/cv/"]').count()) === 0,
    "no CV control while cv.available is false",
  )

  await browser.close()
}

/* 15. M6 sections without JS — every fact must be in the SSR markup. */
console.log("\n[experience · skills · contact · no javascript]")
{
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "load" })

  const roles = await page.locator("#experience ol > li h3").allTextContents()
  ok(roles.length > 0, "timeline entries render without JS (" + roles.length + ")")

  /* Parent opacity, per the M2 trap — the hiding style sits on Reveal's wrapper. */
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("#experience ol > li, #skills li, #contact a")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.textContent.trim().slice(0, 40)),
  )
  ok(
    hidden.length === 0,
    "M6 content is opaque without JS" + (hidden.length ? ": " + hidden.join(" | ") : ""),
  )

  ok((await page.locator("#skills li").count()) > 0, "skill chips render without JS")
  ok((await page.locator("#contact a").count()) > 0, "contact links render without JS")
  ok((await page.locator("footer a").count()) > 0, "footer socials render without JS")

  await browser.close()
}

/* 16. M6 sections under reduced motion — §4.4. */
console.log("\n[experience · skills · contact · reduced motion]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ reducedMotion: "reduce" })
  await page.goto(ORIGIN + "/" + BUILT, { waitUntil: "networkidle" })
  await page.evaluate(() => document.getElementById("experience")?.scrollIntoView())
  await page.waitForTimeout(600)

  const faded = await page.evaluate(() =>
    [...document.querySelectorAll("#experience ol > li, #skills li")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.textContent.trim().slice(0, 40)),
  )
  ok(
    faded.length === 0,
    "M6 content is opaque under reduced motion" + (faded.length ? ": " + faded.join(" | ") : ""),
  )

  /*
    §4.4 makes "renders plainly" first-class: the rail is drawn in full and
    static, not animated faster. Reading it at the TOP of the section is what
    makes this mean something — the scroll-driven fill would still be near zero
    there, so an unscaled transform can only be the static branch.
  */
  const fill = await page.evaluate(() => {
    const ol = document.querySelector("#experience ol")
    const el = ol?.parentElement?.querySelector('[aria-hidden="true"] > *')
    return el ? getComputedStyle(el).transform : null
  })
  ok(
    fill !== null && (fill === "none" || /^matrix\(1, 0, 0, 1,/.test(fill)),
    "rail fill is unscaled (static, full height) under reduced motion: " + fill,
  )

  await browser.close()
}

/* ------------------------------------------------------------------ M4 */

/*
  17. Case-study routing — product.md §2.6, §5.2.

  The slug list is read from the persona page's own hrefs rather than imported
  from content/case-studies.ts. A test that reads the same source as the code
  under test cannot catch that source being wrong — the same rule the RESERVED
  list above already follows.
*/
const SLUGS = [
  ...new Set(
    [...html.matchAll(new RegExp('href="/' + BUILT + '/work/([^"/]+)"', "g"))].map((m) => m[1]),
  ),
]

console.log("\n[case study · routing]")
{
  ok(SLUGS.length > 0, "persona page links to " + SLUGS.length + " case studies")

  for (const slug of SLUGS) {
    const res = await fetch(ORIGIN + "/" + BUILT + "/work/" + slug, { redirect: "manual" })
    ok(res.status === 200, "/" + BUILT + "/work/" + slug + " returns 200, got " + res.status)
  }

  /* Same §2.6 rule as /xyz: a 404, never a redirect that confirms the shape. */
  const unknown = await fetch(ORIGIN + "/" + BUILT + "/work/nope", { redirect: "manual" })
  ok(unknown.status === 404, "unknown slug returns 404, got " + unknown.status)
  ok(unknown.headers.get("location") === null, "unknown slug sends no Location header")

  /*
    A real slug under a RESERVED persona. This is the combination that would
    leak: the code is unbuilt but the slug exists, so a route that guarded only
    the slug would answer 200 and confirm the persona.
  */
  const first = SLUGS[0]
  for (const code of RESERVED) {
    const res = await fetch(ORIGIN + "/" + code + "/work/" + first, { redirect: "manual" })
    ok(res.status === 404, "/" + code + "/work/" + first + " returns 404, got " + res.status)
  }
}

const studyUrl = ORIGIN + "/" + BUILT + "/work/" + SLUGS[0]
const studyHtml = await (await fetch(studyUrl)).text()

/*
  18. Case-study indexing — §2.4, and the trap this route was written around:
  generateMetadata inherits from the parent LAYOUT, and app/[persona]/layout.tsx
  exports no metadata. A passing [indexing] group on /swe proves nothing here —
  the values are restated in the sub-route or they do not exist.
*/
console.log("\n[case study · indexing]")
{
  const meta = studyHtml.match(/<meta name="robots" content="([^"]*)"/i)
  ok(meta !== null, "case study emits a robots meta tag")
  ok(/noindex/i.test(meta?.[1] ?? ""), "case study robots contains noindex — got: " + meta?.[1])
  ok(/nofollow/i.test(meta?.[1] ?? ""), "case study robots contains nofollow")
  ok(
    !/<link rel="canonical"/i.test(studyHtml),
    "case study emits no canonical link (§2.4 — not shareable into an index)",
  )

  const sitemap = await (await fetch(ORIGIN + "/sitemap.xml")).text()
  ok(!/\/work\//.test(sitemap), "sitemap.xml lists no case-study path")
}

/* 19. Case-study isolation — §2.1-2.3. The back link is the new risk surface. */
console.log("\n[case study · isolation]")
{
  const hrefs = [...studyHtml.matchAll(/href="([^"]*)"/g)].map((m) => m[1])
  ok(hrefs.length > 0, "found " + hrefs.length + " hrefs on the case study")

  const offending = []
  for (const href of hrefs) {
    if (/^(mailto:|tel:|#)/.test(href)) continue
    let resolved
    try {
      resolved = new URL(href, studyUrl)
    } catch {
      continue
    }
    if (resolved.origin !== ORIGIN) continue

    const path = resolved.pathname.replace(/\/$/, "")
    if (path === "") offending.push(href + " -> homepage")
    const seg = path.split("/")[1]
    if (seg && seg !== BUILT && RESERVED.includes(seg)) offending.push(href + " -> persona " + seg)
  }
  ok(
    offending.length === 0,
    "no case-study anchor resolves to / or another persona" +
      (offending.length ? ": " + offending.join(", ") : ""),
  )

  /*
    Nav anchors must be persona-absolute here. A bare "#work" resolves inside
    the case study and silently goes nowhere — a dead nav that every other
    assertion in this file would happily pass.
  */
  const navHrefs = [...studyHtml.matchAll(/<header[\s\S]*?<\/header>/g)]
    .flatMap((m) => [...m[0].matchAll(/href="([^"]*)"/g)].map((h) => h[1]))
    .filter((h) => h.includes("#"))
  ok(navHrefs.length > 0, "nav renders " + navHrefs.length + " section anchors")
  const bare = navHrefs.filter((h) => h.startsWith("#"))
  ok(
    bare.length === 0,
    "no nav anchor is a bare fragment" + (bare.length ? ": " + bare.join(", ") : ""),
  )

  /* And the way out is persona-relative, which is the only way out there is. */
  ok(hrefs.includes("/" + BUILT + "#work"), 'case study links back to "/' + BUILT + '#work"')
}

/* 20. Case-study gallery — §5.2 "the same lightbox component", §7. */
console.log("\n[case study · gallery]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(studyUrl, { waitUntil: "networkidle" })

  ok((await page.locator("h1").count()) === 1, "exactly one h1 on the case study")

  /* §7 heading order — the MDX body must not open above the page title. */
  const levels = await page.evaluate(() =>
    [...document.querySelectorAll("main h1, main h2, main h3, main h4")].map((h) =>
      Number(h.tagName[1]),
    ),
  )
  ok(levels[0] === 1, "case study opens at <h1>, got h" + levels[0])
  ok(
    levels.every((lvl, i) => i === 0 || lvl - levels[i - 1] <= 1),
    "no heading level is skipped: " + levels.join(","),
  )

  const shots = await page.locator('button[aria-label^="Enlarge image "]').count()
  ok(shots > 0, "gallery renders " + shots + " triggers")

  /* Tab to it, not .focus() — same reason as the work grid. */
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.locator("body").click({ position: { x: 2, y: 2 } })
  let reached = false
  for (let i = 0; i < 100 && !reached; i++) {
    await page.keyboard.press("Tab")
    reached = await page.evaluate(() =>
      (document.activeElement?.getAttribute("aria-label") ?? "").startsWith("Enlarge image "),
    )
  }
  ok(reached, "a gallery trigger is reachable by Tab")

  const triggerLabel = await page.evaluate(
    () => document.activeElement?.getAttribute("aria-label") ?? "",
  )

  await page.keyboard.press("Enter")
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  ok(await dialog.isVisible(), "Enter opens the lightbox")
  ok(
    await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
    "focus lands inside the dialog",
  )

  const counter = page.locator('[role="dialog"] [aria-live="polite"]')
  if (shots > 1 && (await counter.count()) > 0) {
    const before = (await counter.first().textContent())?.trim()
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(150)
    ok(
      (await counter.first().textContent())?.trim() !== before,
      "ArrowRight advances from " + before,
    )
  } else {
    /*
      Not a skip. Which slug sorts first in the grid is content, and a
      single-image set has nothing to advance to — the arrows are already
      asserted against a multi-image set in [work grid].
    */
    ok(shots === 1, "single-image gallery has no counter to advance (" + shots + " image)")
  }

  await page.keyboard.press("Escape")
  /*
    Wait for the node to detach, not for a fixed delay. The exit is a ~200ms
    fade, so a hardcoded timeout asserts a boundary rather than the behaviour —
    and lands on the wrong side of it whenever the tween shifts.
  */
  await dialog.waitFor({ state: "detached", timeout: 2000 }).catch(() => {})
  ok((await dialog.count()) === 0, "Escape closes the lightbox")
  /*
    THE ASSERTION Lightbox DELEGATES. Its docblock states it does not restore
    focus "because only the opener knows which button to go back to", so this
    is the only place the gallery's own onClose is checked.
  */
  ok(
    (await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "")) ===
      triggerLabel,
    "focus returns to the trigger that opened it",
  )
  ok(
    (await page.evaluate(() => getComputedStyle(document.body).overflow)) !== "hidden",
    "body scroll lock is released",
  )

  await browser.close()
}

/* 21. Case study without JS — the prose IS the page. */
console.log("\n[case study · no javascript]")
{
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(studyUrl, { waitUntil: "load" })

  const paras = await page.locator("main p").count()
  ok(paras > 0, "MDX prose renders without JS (" + paras + " paragraphs)")
  ok((await page.locator("main h2").count()) > 0, "body headings render without JS")

  /* Parent opacity, per the M2 wrapper trap. */
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("main p, main h1, main h2")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.textContent.trim().slice(0, 40)),
  )
  ok(
    hidden.length === 0,
    "case-study prose is opaque without JS" + (hidden.length ? ": " + hidden.join(" | ") : ""),
  )

  /* The gallery degrades to plain images — the thumbnails are server-rendered. */
  ok(
    (await page.locator('button[aria-label^="Enlarge image "]').count()) > 0,
    "gallery thumbnails render without JS",
  )
  ok(
    (await page.locator('[role="dialog"]').count()) === 0,
    "no lightbox markup ships with the document",
  )

  await browser.close()
}

/* 22. Case study under reduced motion — §4.4. */
console.log("\n[case study · reduced motion]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  })
  await page.goto(studyUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(600)

  const faded = await page.evaluate(() =>
    [...document.querySelectorAll("main p, main h1, main h2")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.textContent.trim().slice(0, 40)),
  )
  ok(
    faded.length === 0,
    "case-study content is opaque under reduced motion" +
      (faded.length ? ": " + faded.join(" | ") : ""),
  )

  await page.locator('button[aria-label^="Enlarge image "]').first().click()
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  ok(await dialog.isVisible(), "lightbox opens under reduced motion")
  await page.keyboard.press("Escape")
  /*
    Detach, not a delay — see the note in [case study · gallery]. The panel exit
    collapses to 0.01s under reduced motion but the BACKDROP fade does not, and
    deliberately so: an opacity cross-fade carries no motion to be sick from,
    which is why lightbox.tsx gates the transform and leaves the fade alone.
    That difference is exactly what a fixed timeout turns into a flake.
  */
  await dialog.waitFor({ state: "detached", timeout: 2000 }).catch(() => {})
  ok((await dialog.count()) === 0, "Escape still closes under reduced motion")

  await browser.close()
}

/*
  23. Case-study overflow — §5, all three breakpoints. The `pre` block is the
  new risk here: a long code line that widens the document instead of scrolling
  inside its own container.
*/
console.log("\n[case study · overflow]")
{
  const browser = await chromium.launch()
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(studyUrl, { waitUntil: "networkidle" })
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    ok(scrollW <= width + 1, width + "px: no horizontal overflow (scrollWidth " + scrollW + ")")
    await page.close()
  }
  await browser.close()
}

/* 24. The case-study client chunks must not carry the enumeration either. */
console.log("\n[case study · bundle]")
{
  const chunks = [...new Set(studyHtml.match(/\/_next\/static\/[^"']+\.js/g) ?? [])]
  ok(chunks.length > 0, "found " + chunks.length + " client chunks to scan")

  const leaked = []
  for (const chunk of chunks) {
    const body = await (await fetch(ORIGIN + chunk)).text()
    for (const code of RESERVED) {
      if (new RegExp("[\"'`]" + code + "[\"'`]").test(body)) leaked.push(code + " in " + chunk)
    }
  }
  ok(
    leaked.length === 0,
    "no reserved code in any case-study chunk" + (leaked.length ? ": " + leaked.join(", ") : ""),
  )
}

/*
  25. Blog routing — §2.6, §5.3.

  Slugs come from the list page's own hrefs, not from content/blog.ts — the
  same rule as [case study · routing] and the RESERVED list: a test that reads
  the source under test cannot catch that source being wrong.
*/
const blogUrl = ORIGIN + "/" + BUILT + "/blog"
const blogHtml = await (await fetch(blogUrl)).text()

const POSTS = [
  ...new Set(
    [...blogHtml.matchAll(new RegExp('href="/' + BUILT + '/blog/([^"/]+)"', "g"))].map((m) => m[1]),
  ),
]

console.log("\n[blog · routing]")
{
  ok(POSTS.length > 0, "blog page 1 links to " + POSTS.length + " posts")

  for (const slug of POSTS) {
    const res = await fetch(ORIGIN + "/" + BUILT + "/blog/" + slug, { redirect: "manual" })
    ok(res.status === 200, "/" + BUILT + "/blog/" + slug + " returns 200, got " + res.status)
  }

  const page2 = await fetch(ORIGIN + "/" + BUILT + "/blog/page/2", { redirect: "manual" })
  ok(page2.status === 200, "/blog/page/2 returns 200, got " + page2.status)

  /* §2.6: a 404, never a redirect that confirms the route shape exists. */
  for (const path of ["/blog/nope", "/blog/page/1", "/blog/page/9"]) {
    const res = await fetch(ORIGIN + "/" + BUILT + path, { redirect: "manual" })
    ok(res.status === 404, BUILT + path + " returns 404, got " + res.status)
    ok(res.headers.get("location") === null, BUILT + path + " sends no Location header")
  }

  /*
    A real slug under a RESERVED code — the combination that would leak, since
    the slug exists and only the persona guard stands between it and a 200.
  */
  for (const code of RESERVED) {
    const list = await fetch(ORIGIN + "/" + code + "/blog", { redirect: "manual" })
    ok(list.status === 404, "/" + code + "/blog returns 404, got " + list.status)
    const post = await fetch(ORIGIN + "/" + code + "/blog/" + POSTS[0], { redirect: "manual" })
    ok(post.status === 404, "/" + code + "/blog/" + POSTS[0] + " returns 404, got " + post.status)
  }
}

const postUrl = ORIGIN + "/" + BUILT + "/blog/" + POSTS[0]
const postHtml = await (await fetch(postUrl)).text()
const page2Html = await (await fetch(ORIGIN + "/" + BUILT + "/blog/page/2")).text()

/*
  26. Blog indexing — §2.4. The non-inheritance assertion, restated for a third
  route family: generateMetadata inherits from the parent LAYOUT, which exports
  none, so each of these three pages either restates robots or has none.
*/
console.log("\n[blog · indexing]")
{
  for (const [label, html] of [
    ["list", blogHtml],
    ["page 2", page2Html],
    ["post", postHtml],
  ]) {
    const meta = html.match(/<meta name="robots" content="([^"]*)"/i)
    ok(meta !== null, label + " emits a robots meta tag")
    ok(/noindex/i.test(meta?.[1] ?? ""), label + " robots contains noindex — got: " + meta?.[1])
    ok(/nofollow/i.test(meta?.[1] ?? ""), label + " robots contains nofollow")
    ok(!/<link rel="canonical"/i.test(html), label + " emits no canonical link (§2.4)")
  }

  const sitemap = await (await fetch(ORIGIN + "/sitemap.xml")).text()
  ok(!/\/blog/.test(sitemap), "sitemap.xml lists no blog path")
}

/* 27. Blog isolation — §2.1-2.3. Prev/next and the paginator are new surfaces. */
console.log("\n[blog · isolation]")
{
  for (const [label, url, html] of [
    ["list", blogUrl, blogHtml],
    ["post", postUrl, postHtml],
  ]) {
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1])
    ok(hrefs.length > 0, label + ": found " + hrefs.length + " hrefs")

    const offending = []
    for (const href of hrefs) {
      if (/^(mailto:|tel:|#)/.test(href)) continue
      let resolved
      try {
        resolved = new URL(href, url)
      } catch {
        continue
      }
      if (resolved.origin !== ORIGIN) continue

      const path = resolved.pathname.replace(/\/$/, "")
      if (path === "") offending.push(href + " -> homepage")
      const seg = path.split("/")[1]
      if (seg && seg !== BUILT && RESERVED.includes(seg))
        offending.push(href + " -> persona " + seg)
    }
    ok(
      offending.length === 0,
      label +
        ": no anchor resolves to / or another persona" +
        (offending.length ? ": " + offending.join(", ") : ""),
    )
  }

  /* The nav's new blog link is a page link, not a fragment, so the existing
     "no bare fragment" assertion does not cover it. These do. */
  ok(
    blogHtml.includes('href="/' + BUILT + '"'),
    "blog list links back to /" + BUILT + " and nowhere higher",
  )
  ok(postHtml.includes('href="/' + BUILT + '/blog"'), "post links back to /" + BUILT + "/blog")
}

/* 28. Pagination — §5.3 "paginated at 10". */
console.log("\n[blog · pagination]")
{
  const slugsOn = (html) => [
    ...new Set(
      [...html.matchAll(new RegExp('href="/' + BUILT + '/blog/([^"/]+)"', "g"))].map((m) => m[1]),
    ),
  ]
  const p1 = slugsOn(blogHtml)
  const p2 = slugsOn(page2Html)

  ok(p1.length === 10, "page 1 lists exactly 10 posts, got " + p1.length)
  ok(p2.length === 2, "page 2 lists the remaining 2 posts, got " + p2.length)
  const overlap = p1.filter((s) => p2.includes(s))
  ok(overlap.length === 0, "the two pages are disjoint" + (overlap.length ? ": " + overlap : ""))

  /* Newest first: the datetime attributes must descend across both pages. */
  const dates = [
    /* Case-insensitive: React serialises the JSX prop name, so the markup
       carries `dateTime="…"`, not the HTML-spec lowercase form. */
    ...[...blogHtml.matchAll(/datetime="(\d{4}-\d{2}-\d{2})"/gi)].map((m) => m[1]),
    ...[...page2Html.matchAll(/datetime="(\d{4}-\d{2}-\d{2})"/gi)].map((m) => m[1]),
  ]
  ok(dates.length === 12, "12 dated cards across both pages, got " + dates.length)
  const descending = dates.every((d, i) => i === 0 || dates[i - 1] >= d)
  ok(descending, "cards are newest-first across both pages: " + dates.join(" "))

  /* Page 1 has one address: the paginator points at /blog, never /blog/page/1. */
  ok(
    page2Html.includes('href="/' + BUILT + '/blog"'),
    "page 2 links back to /blog, not /blog/page/1",
  )
  ok(
    !page2Html.includes('href="/' + BUILT + '/blog/page/1"'),
    "no link anywhere points at /blog/page/1",
  )
  ok(blogHtml.includes('href="/' + BUILT + '/blog/page/2"'), "page 1 links forward to /blog/page/2")
}

/*
  29. Outline — THE DRIFT GUARD, and the reason lib/slugify.ts exists as one
  function with two callers. content/blog.ts derives the outline hrefs from the
  raw markdown; mdx-components.tsx sets the ids from the rendered children. If
  those two ever disagree — a heading with inline code, say, which is the
  documented ceiling — every outline link silently stops resolving and nothing
  else in this file notices. This is what notices.
*/
console.log("\n[blog · outline]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(postUrl, { waitUntil: "networkidle" })

  const ids = await page.evaluate(() =>
    [...document.querySelectorAll("main h2[id], main h3[id]")].map((h) => h.id),
  )
  /* The desktop aside only — the mobile <details> renders the same list, and
     counting both would compare a doubled set against a single one. */
  const hrefs = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('aside a[href^="#"]')].map((a) =>
        a.getAttribute("href").slice(1),
      ),
    ),
  ])

  ok(ids.length > 0, "post renders " + ids.length + " headings with ids")
  ok(hrefs.length > 0, "outline renders " + hrefs.length + " links")
  const missing = ids.filter((id) => !hrefs.includes(id))
  const dangling = hrefs.filter((h) => !ids.includes(h))
  ok(
    missing.length === 0 && dangling.length === 0,
    "every heading id has an outline link and vice versa" +
      (missing.length ? " — headings with no link: " + missing.join(", ") : "") +
      (dangling.length ? " — links with no heading: " + dangling.join(", ") : ""),
  )

  /*
    Scroll-spy: the active link tracks the heading in the reading band.

    A MID-DOCUMENT heading, NOT the last one. These posts are ~1670px tall in a
    900px viewport, so the last two headings can never reach the top band — the
    page runs out of scroll first and an earlier heading stays correctly active.
    Asserting on the final heading would fail a component that is behaving.

    And it POLLS for the expected href rather than waiting on the link being
    "visible": the previously-active link is already visible, so that wait
    resolves instantly and reads the state before the observer has fired.
  */
  const target = ids[1] ?? ids[0]
  await page.evaluate((id) => document.getElementById(id).scrollIntoView(), target)
  const active = await page
    .waitForFunction(
      (id) =>
        document.querySelector('aside a[aria-current="location"]')?.getAttribute("href") ===
        "#" + id,
      target,
      { timeout: 3000 },
    )
    .then(() => true)
    .catch(() => false)
  ok(active, "aria-current lands on the heading scrolled into the band (#" + target + ")")

  /* Click-to-jump: the hash changes and the heading is actually in view. */
  await page.evaluate(() => window.scrollTo(0, 0))
  const jumpTo = ids[ids.length - 1]
  await page.locator('aside a[href="#' + jumpTo + '"]').click()
  await page.waitForFunction((id) => location.hash === "#" + id, jumpTo, { timeout: 3000 })
  ok(true, "clicking an outline link sets location.hash to #" + jumpTo)
  /*
    Polled, not read once: the hash updates the instant the link is followed
    while the scroll itself is animated, so a single read lands mid-flight and
    reports a heading that is about to be in view as though it were not.
  */
  const inView = await page
    .waitForFunction(
      (id) => {
        const box = document.getElementById(id).getBoundingClientRect()
        return box.top >= 0 && box.top < window.innerHeight
      },
      jumpTo,
      { timeout: 3000 },
    )
    .then(() => true)
    .catch(() => false)
  ok(inView, "the target heading is in the viewport, below the fixed nav")

  await browser.close()
}

/* 30. Blog without JS — the prose IS the page, and the outline still opens. */
console.log("\n[blog · no javascript]")
{
  const browser = await chromium.launch()
  /*
    375px wide, because the outline renders twice: a `<details>` below `md` and
    a sticky `<aside>` at and above it. At a desktop viewport the disclosure is
    in the DOM but display:none and the click below times out — the component
    would be right and the viewport wrong.
  */
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 800 },
  })
  const page = await ctx.newPage()
  await page.goto(postUrl, { waitUntil: "load" })

  const paras = await page.locator("main p").count()
  ok(paras > 0, "post prose renders without JS (" + paras + " paragraphs)")
  ok((await page.locator("main h2").count()) > 0, "body headings render without JS")

  /* <details> is the whole reason the mobile outline is not a button. */
  const details = page.locator("details")
  ok((await details.count()) > 0, "outline ships as a native <details>")
  await details.first().locator("summary").click()
  ok(await details.first().evaluate((el) => el.open), "the disclosure opens with JS disabled")
  ok(
    (await details.first().locator('a[href^="#"]').count()) > 0,
    "outline links are present inside it",
  )

  /* Parent opacity, per the M2 wrapper trap. */
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("main p, main h1, main h2")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.textContent.trim().slice(0, 40)),
  )
  ok(
    hidden.length === 0,
    "post prose is opaque without JS" + (hidden.length ? ": " + hidden.join(" | ") : ""),
  )

  /* And the list paginates without a runtime — plain anchors, server-rendered. */
  const list = await ctx.newPage()
  await list.goto(blogUrl, { waitUntil: "load" })
  ok((await list.locator("main article").count()) === 10, "10 cards render without JS")
  await list.locator('nav[aria-label="Blog pages"] a').first().click()
  await list.waitForURL(/\/blog\/page\/2$/, { timeout: 5000 })
  ok(true, "the paginator navigates to page 2 without JS")

  await browser.close()
}

/* 31. Blog under reduced motion — §4.4. */
console.log("\n[blog · reduced motion]")
{
  const browser = await chromium.launch()
  const page = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  })
  await page.goto(blogUrl, { waitUntil: "networkidle" })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(600)

  const faded = await page.evaluate(() =>
    [...document.querySelectorAll("main h1, main h3, main article p")]
      .filter((el) => getComputedStyle(el.parentElement).opacity !== "1")
      .map((el) => el.textContent.trim().slice(0, 40)),
  )
  ok(
    faded.length === 0,
    "blog cards are opaque under reduced motion" + (faded.length ? ": " + faded.join(" | ") : ""),
  )

  await browser.close()
}

/*
  32. Blog overflow — §5, all three breakpoints. The sticky aside is the new
  risk: a two-column grid whose prose column has no min-width will be widened
  by a single long `pre` line instead of scrolling inside it.
*/
console.log("\n[blog · overflow]")
{
  const browser = await chromium.launch()
  for (const width of [375, 768, 1440]) {
    for (const [label, url] of [
      ["list", blogUrl],
      ["post", postUrl],
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      await page.goto(url, { waitUntil: "networkidle" })
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      ok(
        scrollW <= width + 1,
        width + "px " + label + ": no horizontal overflow (scrollWidth " + scrollW + ")",
      )
      await page.close()
    }
  }

  /* The aside must sit beside the prose on desktop, never on top of it. */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(postUrl, { waitUntil: "networkidle" })
  const overlap = await page.evaluate(() => {
    const aside = document.querySelector("aside")
    const article = document.querySelector("main article")
    if (!aside || !article) return "missing element"
    const a = aside.getBoundingClientRect()
    const b = article.getBoundingClientRect()
    return a.left < b.right && b.left < a.right ? "overlapping" : null
  })
  ok(overlap === null, "the sticky outline does not overlap the prose: " + overlap)
  await browser.close()
}

/* 33. The blog client chunks must not carry the enumeration either. */
console.log("\n[blog · bundle]")
{
  const chunks = [
    ...new Set([
      ...(blogHtml.match(/\/_next\/static\/[^"']+\.js/g) ?? []),
      ...(postHtml.match(/\/_next\/static\/[^"']+\.js/g) ?? []),
    ]),
  ]
  ok(chunks.length > 0, "found " + chunks.length + " client chunks to scan")

  const leaked = []
  for (const chunk of chunks) {
    const body = await (await fetch(ORIGIN + chunk)).text()
    for (const code of RESERVED) {
      if (new RegExp("[\"'`]" + code + "[\"'`]").test(body)) leaked.push(code + " in " + chunk)
    }
  }
  ok(
    leaked.length === 0,
    "no reserved code in any blog chunk" + (leaked.length ? ": " + leaked.join(", ") : ""),
  )
}

console.log(
  fail.length === 0
    ? "\nAll persona assertions passed."
    : "\n" + fail.length + " assertion(s) failed:\n  " + fail.join("\n  "),
)
process.exit(fail.length === 0 ? 0 : 1)
