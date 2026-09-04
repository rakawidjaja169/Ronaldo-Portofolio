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
const PLACEHOLDER = /\bTODO\b/

/**
 * Skip comment lines. Prose explaining the placeholder convention is not
 * itself a placeholder, and a guard that flags its own documentation trains
 * people to ignore it.
 */
const COMMENT = /^\s*(\/\/|\/\*|\*)/

const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".ts"))

const findings = []
for (const file of files) {
  const full = path.join(CONTENT_DIR, file)
  const lines = (await readFile(full, "utf8")).split(/\r?\n/)
  lines.forEach((line, i) => {
    if (COMMENT.test(line)) return
    if (PLACEHOLDER.test(line)) {
      findings.push({ file: path.posix.join("content", file), line: i + 1, text: line.trim() })
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
