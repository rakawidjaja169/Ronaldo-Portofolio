/**
 * Generates the abstract card visuals for the five projects whose screenshots
 * are not cleared for publication.
 *
 * WHY THESE EXIST. scripts/prepare-work-images.mjs gates real screenshots
 * behind a SETS whitelist, and everything outside it fell back to one flat
 * `_placeholder.webp` — the same wash five times over, which read as a missing
 * asset rather than a decision. These replace it with a distinct schematic per
 * project: enough structure to say what shape the software has, and nothing
 * that came out of an employer's database.
 *
 * NOT SCREENSHOT MIMICS, and the alt text in content/work.ts says so. A
 * drawing that passes for a screenshot is a worse failure than a blank box,
 * because a reader cannot tell it apart from the real thing.
 *
 * Pure geometry in the site's own tokens, the same idiom
 * components/persona/backdrop-poster.tsx already uses: #242424 ground, #ff914d
 * structure at low opacity, one grain pass. Deterministic — no randomness, so
 * a re-run produces byte-identical output and the diff stays empty.
 *
 * OFFLINE. Not wired into `npm run build` or CI, for the same reason the
 * screenshot pipeline is not: it needs `sharp`, it runs once, and its output
 * is committed.
 *
 *   node scripts/generate-app-visuals.mjs
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const OUT_DIR = path.join(process.cwd(), "public", "work")
const W = 1600
const H = 1000
/* 16:10, matching the card's aspect box — same values as the screenshot pipeline. */
const THUMB = { width: 800, height: 500 }
const QUALITY = 78

const BASE = "#242424"
const ACCENT = "#ff914d"
const INK = "#ffffff"

/* ---------------------------------------------------------------- helpers */

const rect = (x, y, w, h, fill, o = 1, r = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" fill-opacity="${o}"/>`

const line = (x1, y1, x2, y2, stroke, o = 1, sw = 2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-opacity="${o}" stroke-width="${sw}" stroke-linecap="round"/>`

const circle = (cx, cy, r, fill, o = 1) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${o}"/>`

/* ------------------------------------------------------------ compositions
   One per project. Each is a schematic of how the app is *organised* — a
   queue, a grid of assets, a floorplan — not of how any screen looked.
*/

/** Ticketing: four queue lanes, one ticket tracked down through their statuses. */
function ticketing() {
  const out = []
  const laneY = [180, 380, 580, 780]
  const queued = [10, 7, 5, 3]
  laneY.forEach((y, i) => {
    out.push(rect(160, y - 52, 1280, 104, INK, 0.03, 12))
    out.push(rect(160, y - 52, 6, 104, ACCENT, 0.15 + i * 0.18, 3))
    /* Cards waiting in the lane; the count falls as work moves along. */
    for (let c = 0; c < queued[i]; c++) {
      out.push(rect(200 + c * 116, y - 30, 96, 60, INK, 0.07, 6))
    }
  })
  /* The one ticket being followed, and its path down through the lanes. */
  out.push(line(1360, 128, 1360, 832, ACCENT, 0.22, 3))
  laneY.forEach((y, i) => {
    out.push(rect(1310, y - 30, 100, 60, ACCENT, 0.1 + i * 0.06, 6))
    out.push(circle(1360, y, 7, ACCENT, 0.55 + i * 0.12))
  })
  return out.join("")
}

/** Inventory: a dense tile field, a handful flagged for attention. */
function inventory() {
  const out = []
  const cols = 12
  const rows = 7
  const size = 96
  const gap = 20
  const x0 = (W - (cols * size + (cols - 1) * gap)) / 2
  const y0 = (H - (rows * size + (rows - 1) * gap)) / 2
  /* Fixed positions, not random: the diff must stay empty on a re-run. */
  const flagged = new Set([3, 17, 26, 41, 55, 58, 70, 79])
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = x0 + c * (size + gap)
      const y = y0 + r * (size + gap)
      if (flagged.has(i)) {
        out.push(rect(x, y, size, size, ACCENT, 0.22, 8))
        out.push(circle(x + size - 18, y + 18, 6, ACCENT, 0.9))
      } else {
        out.push(rect(x, y, size, size, INK, 0.05, 8))
        out.push(rect(x + 14, y + size - 26, size - 44, 8, INK, 0.08, 4))
      }
    }
  }
  return out.join("")
}

/** Facility: floorplan blocks with one request routed between them. */
function facility() {
  const out = []
  const blocks = [
    [180, 160, 420, 300],
    [640, 160, 300, 180],
    [990, 160, 430, 300],
    [180, 560, 300, 280],
    [530, 500, 410, 340],
    [990, 560, 430, 280],
  ]
  for (const [x, y, w, h] of blocks) {
    out.push(rect(x, y, w, h, INK, 0.04, 10))
    out.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${INK}" stroke-opacity="0.09" stroke-width="2"/>`,
    )
  }
  /* Orthogonal, like a corridor — a diagonal would read as a chart line. */
  const route = "M 390 460 L 390 500 L 735 500 L 735 340 L 790 340 L 790 310 L 1205 310"
  out.push(
    `<path d="${route}" fill="none" stroke="${ACCENT}" stroke-opacity="0.5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  )
  out.push(circle(390, 460, 12, ACCENT, 0.85))
  out.push(circle(1205, 310, 12, ACCENT, 0.85))
  return out.join("")
}

/** LMS: stacked module rows, each with its own progress rule. */
function lms() {
  const out = []
  const progress = [1, 0.86, 0.62, 0.44, 0.21, 0.08]
  progress.forEach((p, i) => {
    const y = 150 + i * 128
    out.push(rect(180, y, 1240, 92, INK, 0.04, 10))
    out.push(circle(232, y + 46, 18, INK, i === 0 ? 0.14 : 0.08))
    out.push(rect(280, y + 30, 300, 12, INK, 0.1, 6))
    out.push(rect(280, y + 56, 180, 8, INK, 0.06, 4))
    /* Progress is the only accent, so the eye reads completion first. */
    out.push(rect(700, y + 42, 660, 10, INK, 0.06, 5))
    out.push(rect(700, y + 42, 660 * p, 10, ACCENT, 0.65, 5))
  })
  return out.join("")
}

/** Evaluation: a criteria matrix, cell weight shown as a bar. */
function evaluation() {
  const out = []
  const cols = 6
  const rows = 5
  const cw = 200
  const ch = 130
  const x0 = (W - cols * cw) / 2
  const y0 = 190
  /* Hand-set so the matrix reads as data rather than noise, and stays stable. */
  const weight = [
    [0.9, 0.6, 0.75, 0.4, 0.85, 0.55],
    [0.5, 0.95, 0.35, 0.7, 0.45, 0.8],
    [0.75, 0.4, 0.9, 0.55, 0.6, 0.3],
    [0.35, 0.7, 0.5, 0.95, 0.25, 0.65],
    [0.8, 0.45, 0.65, 0.3, 0.9, 0.5],
  ]
  for (let c = 0; c < cols; c++) {
    out.push(rect(x0 + c * cw + 24, y0 - 54, cw - 72, 10, INK, 0.1, 5))
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * cw
      const y = y0 + r * ch
      const w = weight[r][c]
      out.push(rect(x + 12, y + 12, cw - 24, ch - 24, INK, 0.035, 8))
      out.push(rect(x + 32, y + ch - 52, cw - 64, 12, INK, 0.06, 6))
      out.push(rect(x + 32, y + ch - 52, (cw - 64) * w, 12, ACCENT, 0.25 + w * 0.45, 6))
    }
  }
  return out.join("")
}

/* --------------------------------------------------------------- assembly */

const SETS = [
  { slug: "ticketing-system", draw: ticketing },
  { slug: "asset-inventory", draw: inventory },
  { slug: "facility-management", draw: facility },
  { slug: "moodle-lms", draw: lms },
  { slug: "evaluation-system", draw: evaluation },
]

/**
 * Two offset washes, not one: a single radial reads as a vignette artifact,
 * two read as light. Taken from backdrop-poster.tsx so the generated cards and
 * the rendered page share one lighting model.
 *
 * The grain is a live feTurbulence here rather than a data URI, because sharp
 * rasterises this once, offline — the repaint cost that made
 * backdrop-poster.tsx avoid an inline filter does not apply at build time.
 */
function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="w1" cx="22%" cy="18%" r="70%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.17"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="w2" cx="82%" cy="88%" r="65%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${BASE}"/>
  <rect width="100%" height="100%" fill="url(#w1)"/>
  <rect width="100%" height="100%" fill="url(#w2)"/>
  ${body}
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.09"/>
</svg>`
}

const kb = (buf) => (buf.length / 1024).toFixed(1) + " kB"

await mkdir(OUT_DIR, { recursive: true })

for (const set of SETS) {
  const source = Buffer.from(svg(set.draw()))
  console.log(`\n${set.slug}`)

  const full = await sharp(source).webp({ quality: QUALITY }).toBuffer()
  await writeFile(path.join(OUT_DIR, `${set.slug}.webp`), full)
  console.log(`  ${set.slug}.webp        ${W}x${H}  ${kb(full)}`)

  const thumb = await sharp(source)
    .resize(THUMB.width, THUMB.height, { fit: "cover" })
    .webp({ quality: QUALITY })
    .toBuffer()
  await writeFile(path.join(OUT_DIR, `${set.slug}-thumb.webp`), thumb)
  console.log(`  ${set.slug}-thumb.webp  ${THUMB.width}x${THUMB.height}  ${kb(thumb)}`)
}

console.log(`\n${SETS.length} visual(s) written to public/work/.`)
