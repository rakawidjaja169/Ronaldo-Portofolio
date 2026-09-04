/**
 * One-off: produce public/portrait.webp from the archived source photo.
 *
 * The source is a 2957x2957 full-body seated shot living only in git history
 * (commit 3ff5c54, path `raka-profile.png`, 3.75 MB). At hero scale the full
 * frame renders the face around 40px and the warm brick background competes
 * with the #FF914D accent, so it is cropped to head-and-shoulders.
 *
 * This exists as a script rather than a hand-crop so the asset's provenance is
 * recorded and a re-crop is one command instead of archaeology.
 *
 *   git show 3ff5c54:raka-profile.png | node scripts/prepare-portrait.mjs
 *
 * Output is committed. This does not run in CI or at build time.
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

/** Crop box in original 2957² coordinates. Face on the upper third, shoulders at the edge. */
const CROP = { left: 700, top: 440, width: 1220, height: 1220 }

/** next/image derives every responsive variant from this one source. */
const OUTPUT_SIZE = 1120
const QUALITY = 80

const OUT = path.join(process.cwd(), "public", "portrait.webp")

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const input = await readStdin()
if (input.length === 0) {
  console.error("No image on stdin. Run:\n  git show 3ff5c54:raka-profile.png | node scripts/prepare-portrait.mjs")
  process.exit(1)
}

const source = sharp(input)
const { width, height } = await source.metadata()
console.log(`source: ${width}x${height}, ${(input.length / 1024 / 1024).toFixed(2)} MB`)

if (CROP.left + CROP.width > width || CROP.top + CROP.height > height) {
  console.error(`Crop box ${JSON.stringify(CROP)} falls outside ${width}x${height}.`)
  process.exit(1)
}

const output = await source
  .extract(CROP)
  .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover" })
  // The source is circle-masked with transparent corners; flatten onto the dark
  // base so the WebP carries no alpha the layout has to reason about.
  .flatten({ background: "#1f1f1f" })
  .webp({ quality: QUALITY })
  .toBuffer()

await mkdir(path.dirname(OUT), { recursive: true })
await writeFile(OUT, output)
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${OUTPUT_SIZE}x${OUTPUT_SIZE}, ${(output.length / 1024).toFixed(1)} KB`)
