/**
 * Fails if any placeholder value survives in content/.
 *
 * content/site.ts ships with placeholder contact details because none were
 * recoverable from git history — the previous scaffold carried v0.dev fiction
 * (john.doe@example.com, bare github.com links). Building against placeholders
 * is fine; deploying them is not.
 *
 * Runs in CI as its own step, deliberately NOT inside `npm run build`:
 * blocking the build would block local iteration on the very pages that
 * consume this data. This gates merge and deploy, which is where a placeholder
 * actually does harm.
 */
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")
/*
  TODO alone stopped being enough once M3 started shipping deliberate
  placeholders: lorem-ipsum copy, `/placeholder.*` image paths, and
  example.com links all sailed past the guard, which made "placeholders cannot
  deploy" a claim rather than a property.
*/
const PLACEHOLDER = /\bTODO\b|lorem ipsum|\/placeholder[./]|example\.com/i

/**
 * Skip comment lines. Prose explaining the placeholder convention is not
 * itself a placeholder, and a guard that flags its own documentation trains
 * people to ignore it.
 */
const COMMENT = /^\s*(\/\/|\/\*|\*)/

/**
 * Recursive: content/ is nested (content/personas/swe.ts). A flat readdir
 * silently skipped every persona file, so the guard passed while placeholders
 * sat one directory down — the exact thing it exists to catch.
 */
async function collect(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await collect(full)))
    else if (entry.name.endsWith(".ts")) out.push(full)
  }
  return out
}

const files = await collect(CONTENT_DIR)

const findings = []
for (const full of files) {
  const rel = path.relative(process.cwd(), full).split(path.sep).join("/")
  const lines = (await readFile(full, "utf8")).split(/\r?\n/)
  lines.forEach((line, i) => {
    if (COMMENT.test(line)) return
    if (PLACEHOLDER.test(line)) {
      findings.push({ file: rel, line: i + 1, text: line.trim() })
    }
  })
}

if (findings.length > 0) {
  console.error(`Unresolved placeholders in content/ (${findings.length}):\n`)
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  ${f.text}`)
  }
  console.error("\nReplace every placeholder with a real value before deploying.")
  process.exit(1)
}

console.log(`content/: no placeholders in ${files.length} file(s).`)
