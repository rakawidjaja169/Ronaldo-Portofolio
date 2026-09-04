/**
 * WCAG contrast gate — docs/design-system.md §1.3
 *
 * Parses the real token values out of app/globals.css rather than a duplicated
 * list, so this check can never drift from what actually ships. Adding a color
 * without adding its assertion here leaves it unverified, which is the failure
 * mode this exists to prevent.
 *
 * Run: npm run check:contrast
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const css = readFileSync(resolve(root, "app/globals.css"), "utf8")

/** Pull `--token: #hex;` declarations out of one CSS block. */
function parseBlock(selector) {
  const start = css.indexOf(selector + " {")
  if (start === -1) throw new Error(`Block not found in globals.css: ${selector}`)
  const open = css.indexOf("{", start)
  const end = css.indexOf("\n}", open)
  if (end === -1) throw new Error(`Unterminated block: ${selector}`)
  const body = css.slice(open + 1, end)

  const tokens = {}
  for (const [, name, hex] of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[name] = hex
  }
  return tokens
}

function srgbToLinear(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  let h = hex.slice(1)
  if (h.length === 3) h = [...h].map((c) => c + c).join("")
  if (h.length !== 6) throw new Error(`Unsupported hex (alpha not allowed in pairs): ${hex}`)
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const themes = {
  dark: parseBlock(":root"),
  light: parseBlock('[data-theme="light"]'),
}

/**
 * min      — required WCAG ratio.
 * forbidden — asserts the pair is BELOW 4.5, documenting why a substitute
 *             token exists. If this ever starts passing, the substitute is
 *             redundant and the design system should say so.
 * info     — reported, not enforced (WCAG exempts disabled controls).
 */
const PAIRS = [
  { theme: "dark", fg: "ink", bg: "base", min: 4.5 },
  { theme: "dark", fg: "ink", bg: "surface", min: 4.5 },
  { theme: "dark", fg: "ink-muted", bg: "base", min: 4.5 },
  { theme: "dark", fg: "ink-muted", bg: "surface", min: 4.5 },
  { theme: "dark", fg: "accent", bg: "base", min: 4.5 },
  { theme: "dark", fg: "accent", bg: "surface", min: 4.5 },
  { theme: "dark", fg: "accent-text", bg: "base", min: 4.5 },
  { theme: "dark", fg: "accent-text", bg: "surface", min: 4.5 },
  { theme: "dark", fg: "border", bg: "base", min: 1.2 },
  { theme: "dark", fg: "ink-faint", bg: "base", info: true },

  { theme: "light", fg: "ink", bg: "base", min: 4.5 },
  { theme: "light", fg: "ink", bg: "surface", min: 4.5 },
  { theme: "light", fg: "ink-muted", bg: "base", min: 4.5 },
  { theme: "light", fg: "ink-muted", bg: "surface", min: 4.5 },
  { theme: "light", fg: "accent-text", bg: "base", min: 4.5 },
  { theme: "light", fg: "accent-text", bg: "surface", min: 4.5 },
  { theme: "light", fg: "border", bg: "base", min: 1.05 },
  { theme: "light", fg: "ink-faint", bg: "base", info: true },

  // Why --accent-text exists in light mode. See design-system.md §1.2.
  { theme: "light", fg: "accent", bg: "base", forbidden: true },
  { theme: "light", fg: "accent", bg: "surface", forbidden: true },
]

let failed = 0

for (const pair of PAIRS) {
  const tokens = themes[pair.theme]
  const fg = tokens[pair.fg]
  const bg = tokens[pair.bg]

  if (!fg || !bg) {
    console.error(`FAIL  ${pair.theme}: missing token --${!fg ? pair.fg : pair.bg}`)
    failed++
    continue
  }

  const r = ratio(fg, bg)
  const shown = r.toFixed(2).padStart(6)
  const label = `${pair.theme.padEnd(5)} ${pair.fg} on ${pair.bg}`

  if (pair.info) {
    console.log(`info  ${shown}:1  ${label}  (disabled state, WCAG exempt)`)
  } else if (pair.forbidden) {
    if (r >= 4.5) {
      console.error(`FAIL  ${shown}:1  ${label}  expected < 4.5 — the substitute token is now redundant`)
      failed++
    } else {
      console.log(`ok    ${shown}:1  ${label}  (below 4.5 as documented — never use as text)`)
    }
  } else if (r < pair.min) {
    console.error(`FAIL  ${shown}:1  ${label}  needs >= ${pair.min}`)
    failed++
  } else {
    console.log(`ok    ${shown}:1  ${label}`)
  }
}

if (failed > 0) {
  console.error(`\n${failed} contrast assertion(s) failed.`)
  process.exit(1)
}
console.log("\nAll contrast assertions passed.")
