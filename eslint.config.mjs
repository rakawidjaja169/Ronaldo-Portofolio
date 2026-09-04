import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Debug logs must not reach production.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Build tooling: stdout IS the deliverable here, not a stray debug log.
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
]

export default config
