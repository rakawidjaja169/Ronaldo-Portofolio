import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // .tmp-* is scratch (see .gitignore). Gitignore does not imply eslintignore.
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts", ".tmp-*"],
  },
  {
    rules: {
      // Debug logs must not reach production.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Build tooling and test runs: stdout IS the deliverable here — the pass/fail
    // report is the whole point — not a stray debug log left behind.
    files: ["scripts/**", "tests/**"],
    rules: { "no-console": "off" },
  },
]

export default config
