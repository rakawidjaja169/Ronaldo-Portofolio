/**
 * WCAG contrast gate — docs/design-system.md §1.3
 *
 * Parses the real token values out of app/globals.css rather than a duplicated
 * list, so this check can never drift from what actually ships. Adding a color
 * without adding its assertion here leaves it unverified, which is the failure
 * mode this exists to prevent.
 *
 * IT UNDERSTANDS TRANSLUCENT BACKGROUNDS, and it has to. --accent-quiet is an
 * rgba() tint, and the tag chips set --accent-text on top of it. Until M7 this
 * script only parsed opaque hex, so that pair was invisible to it: the text
 * passed against --base at 4.96:1 while the composited reality was 4.46:1, and
 * it took scripts/check-a11y.mjs to find it. A pair whose background has alpha
 * is composited over its own `over` base before the ratio is taken.
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
  for (const [, name, value] of body.matchAll(
    /--([\w-]+):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\s*;/g,
  )) {
    tokens[name] = value
  }
  return tokens
}

/** `#rgb`, `#rrggbb` or `rgba(r, g, b, a)` -> `{ rgb: [r,g,b], alpha }`. */
function parseColor(value) {
  const fn = value.match(/^rgba?\(([^)]*)\)$/)
  if (fn) {
    const parts = fn[1].split(",").map((n) => parseFloat(n.trim()))
    return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 }
  }
  let h = value.slice(1)
  if (h.length === 3) h = [...h].map((c) => c + c).join("")
  if (h.length !== 6) throw new Error(`Unsupported color: ${value}`)
  return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: 1 }
}

/** Source-over composite. What the eye actually sees, and what axe measures. */
function composite(fg, bg) {
  return fg.rgb.map((c, i) => c * fg.alpha + bg.rgb[i] * (1 - fg.alpha))
}

function srgbToLinear(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear)
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

function ratio(fgRgb, bgRgb) {
  const [a, b] = [luminance(fgRgb), luminance(bgRgb)].sort((x, y) => y - x)
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
 * over     — required when `bg` is translucent: the opaque token underneath it.
 *             Omitting it on an rgba background is what hid the chip failure.
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
  { theme: "dark", fg: "on-accent", bg: "accent", min: 4.5 },
  { theme: "dark", fg: "border", bg: "base", min: 1.2 },
  { theme: "dark", fg: "ink-faint", bg: "base", info: true },
  /* The tag chips. --accent-quiet has alpha, so it is composited over `over`
     first — see the docblock; this is the pair axe found and this script could
     not previously express. */
  { theme: "dark", fg: "accent-text", bg: "accent-quiet", over: "base", min: 4.5 },
  { theme: "dark", fg: "accent-text", bg: "accent-quiet", over: "surface", min: 4.5 },

  { theme: "light", fg: "ink", bg: "base", min: 4.5 },
  { theme: "light", fg: "ink", bg: "surface", min: 4.5 },
  { theme: "light", fg: "ink-muted", bg: "base", min: 4.5 },
  { theme: "light", fg: "ink-muted", bg: "surface", min: 4.5 },
  { theme: "light", fg: "accent-text", bg: "base", min: 4.5 },
  { theme: "light", fg: "accent-text", bg: "surface", min: 4.5 },
  { theme: "light", fg: "on-accent", bg: "accent", min: 4.5 },
  { theme: "light", fg: "border", bg: "base", min: 1.05 },
  { theme: "light", fg: "ink-faint", bg: "base", info: true },
  { theme: "light", fg: "accent-text", bg: "accent-quiet", over: "base", min: 4.5 },
  { theme: "light", fg: "accent-text", bg: "accent-quiet", over: "surface", min: 4.5 },

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

  const bgColor = parseColor(bg)
  if (bgColor.alpha < 1 && !pair.over) {
    console.error(`FAIL  ${pair.theme}: --${pair.bg} is translucent and the pair names no \`over\``)
    failed++
    continue
  }

  const bgRgb =
    bgColor.alpha < 1 ? composite(bgColor, parseColor(tokens[pair.over])) : bgColor.rgb
  const r = ratio(parseColor(fg).rgb, bgRgb)
  const shown = r.toFixed(2).padStart(6)
  const label =
    `${pair.theme.padEnd(5)} ${pair.fg} on ${pair.bg}` + (pair.over ? ` over ${pair.over}` : "")

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
