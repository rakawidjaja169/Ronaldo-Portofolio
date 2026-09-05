/**
 * One-off: produce public/work/** from the raw screenshot sets.
 *
 * The sources are 30 PNG screenshots at 1918px wide, 12.65 MB total, committed
 * in c35dee3 by the previous scaffold. Shipping them raw would blow the §8
 * budget on a single card, and runtime `next/image` optimization is not a safe
 * answer here: `sharp` is only an OPTIONAL transitive of Next, and
 * `output: "standalone"` may not trace it into the Docker image. So the work is
 * done once, offline, and the output is committed.
 *
 *   node scripts/prepare-work-images.mjs
 *
 * PUBLICATION GATE. `SETS` below lists only the projects cleared to show real
 * screenshots publicly. Five of the six are an employer's internal admin tools
 * and that permission is still open (see docs/roadmap.md M3). Everything not
 * listed renders a generated schematic instead — see
 * scripts/generate-app-visuals.mjs. Granting permission later means
 * adding one entry here and re-running — no component changes.
 *
 * Sources are DELETED from public/ after conversion. They remain in git history
 * at c35dee3, the same arrangement as raka-profile.png at 3ff5c54.
 *
 * Does not run in CI or at build time.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const PUBLIC = path.join(process.cwd(), "public")
const OUT_DIR = path.join(PUBLIC, "work")

/** Cleared for publication. Everything else gets a generated schematic. */
const SETS = [
  {
    prefix: "online_admission",
    slug: "online-admission-sdh",
    /* Order is the lightbox order: entry point first, then the flow. */
    shots: ["home", "index", "form", "dashboard", "reports"],
  },
]

/** Every raw prefix, cleared or not — used to know what to delete. */
const ALL_PREFIXES = ["online_admission", "ticketing", "inventory", "fm", "moodle", "evaluation"]

const FULL_WIDTH = 1600
const THUMB = { width: 800, height: 500 } // 16:10, matches the card's aspect box
const QUALITY = 78

const kb = (b) => (b.length / 1024).toFixed(1) + " KB"

await mkdir(OUT_DIR, { recursive: true })

for (const set of SETS) {
  const dir = path.join(OUT_DIR, set.slug)
  await mkdir(dir, { recursive: true })
  console.log("\n" + set.slug)

  for (const [i, shot] of set.shots.entries()) {
    const source = path.join(PUBLIC, `${set.prefix}_${shot}.png`)
    const input = sharp(source)
    const meta = await input.metadata()

    const full = await sharp(source)
      .resize(FULL_WIDTH, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()
    const fullMeta = await sharp(full).metadata()
    await writeFile(path.join(dir, `${i}.webp`), full)

    /*
      Thumbs crop from the top rather than centre. These are admin screens: the
      header, the page title, and the first table rows are what makes one
      recognisable at card size. A centre crop lands on empty table body.
    */
    const thumb = await sharp(source)
      .resize(THUMB.width, THUMB.height, { fit: "cover", position: "top" })
      .webp({ quality: QUALITY })
      .toBuffer()
    await writeFile(path.join(dir, `${i}-thumb.webp`), thumb)

    console.log(
      `  ${i}.webp        ${fullMeta.width}x${fullMeta.height}  ${kb(full)}   (from ${meta.width}x${meta.height})`,
    )
    console.log(`  ${i}-thumb.webp  ${THUMB.width}x${THUMB.height}  ${kb(thumb)}`)
  }
}

/*
  The flat `_placeholder.webp` this script used to emit is gone. Every project
  outside SETS now carries a distinct generated schematic instead — see
  scripts/generate-app-visuals.mjs. One wash repeated five times read as a
  missing asset rather than as a decision.

  THE GATE ABOVE IS NOT DEAD CODE. SETS is still the only thing that decides
  which projects show real screenshots, and the raw sets are still in git at
  c35dee3. If permission arrives for one of the internal tools, add it here and
  drop its `visual(...)` call in content/work.ts.
*/

/* Sources out of public/. They live on in c35dee3. */
const entries = await readdir(PUBLIC)
let removed = 0
for (const name of entries) {
  if (!name.endsWith(".png")) continue
  if (!ALL_PREFIXES.some((prefix) => name.startsWith(prefix + "_"))) continue
  await rm(path.join(PUBLIC, name))
  removed++
}
console.log(`\nremoved ${removed} source PNG(s) from public/ — recover with: git show c35dee3:public/<name>`)
