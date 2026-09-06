/**
 * Performance budget gate — docs/design-system.md §8
 *
 * §8 has said "Enforced by a Lighthouse CI gate on every PR. Regression fails
 * the build" since M0, and no such gate existed. This is it.
 *
 * SEO IS NOT ASSERTED AS A SCORE, AND THAT IS DELIBERATE. Every route carries
 * `robots: noindex`, so `is-crawlable` fails by design and the SEO category
 * cannot reach §8's 95 — docs/product.md §2.4 requires exactly that. Asserting
 * the score would mean either deleting the assertion or breaking the product.
 * So the assertion is on the SET of failing SEO audits: it must be exactly
 * {is-crawlable}. A missing title or a bad meta description adds a second id
 * and still fails the build, which is what an SEO gate is actually for.
 *
 * --report-only downgrades every threshold to a warning. It exists because
 * this machine serves the site AND runs the throttled audit on the same CPU,
 * which swings the performance score by ~8 points run to run. CI does not pass
 * the flag. If the runner cannot hold the number either, that is a finding to
 * record — not a reason to lower it.
 *
 * M8's run against the deployed site is the authoritative reading. This gate
 * catches a regression, which is a different job.
 *
 * Lighthouse is invoked with `npx`, NOT installed as a devDependency: it pulls
 * puppeteer's browser downloader, which carries four high-severity advisories
 * with no non-breaking fix (extract-zip symlink traversal, GHSA-jmr9-qjv8-65gv).
 * This repo has already been through one Dependabot cleanup; a test-only tool
 * is not worth putting them back into package-lock.json.
 *
 * Prerequisite: a served production build on BASE_URL (default :3000).
 * Run: npm run check:budget  [-- --report-only]
 */
import { execSync } from "node:child_process"
import { readFileSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ORIGIN = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const REPORT_ONLY = process.argv.includes("--report-only")
const BUILT = "swe"

/** §8. Scores are 0-1 in the JSON; stated here as the doc states them. */
const MIN = { performance: 95, accessibility: 95, "best-practices": 95 }
/**
 * §2.4 — the one SEO audit that must fail on a persona route, and the only one
 * allowed to.
 *
 * THE HOMEPAGE IS NOT A PERSONA ROUTE. It is the public front door: it is meant
 * to be indexed, it carries no `noindex`, and `is-crawlable` passing there is
 * correct. The first run of this gate asserted noindex everywhere and failed the
 * homepage for being crawlable — the expectation is per-route, and the route
 * table below carries it.
 */
const NOINDEX = new Set(["is-crawlable"])
const INDEXED = new Set()

const home = await fetch(ORIGIN + "/").catch(() => null)
if (!home?.ok) {
  console.error("\nNo server at " + ORIGIN + " — run `npm run build` then `npx next start` first.")
  process.exit(1)
}

/* Derived, not listed — same rule as scripts/check-a11y.mjs and
   tests/persona.mjs:23. A hardcoded slug outlives the route that served it. */
const personaHtml = await (await fetch(ORIGIN + "/" + BUILT)).text()
const blogHtml = await (await fetch(ORIGIN + "/" + BUILT + "/blog")).text()
const first = (html, kind) =>
  html.match(new RegExp('href="/' + BUILT + "/" + kind + '/([^"/]+)"'))?.[1]

const workSlug = first(personaHtml, "work")
const postSlug = first(blogHtml, "blog")
if (!workSlug || !postSlug) {
  console.error("\nRoute derivation found nothing — an empty sweep would pass vacuously.")
  process.exit(1)
}

/**
 * The 404 is excluded. Lighthouse scores a 404 response as a failed navigation,
 * and its a11y is covered by check-a11y.mjs, which does sweep it.
 */
const ROUTES = [
  ["homepage", "/", INDEXED],
  ["persona", "/" + BUILT, NOINDEX],
  ["case study", "/" + BUILT + "/work/" + workSlug, NOINDEX],
  ["blog list", "/" + BUILT + "/blog", NOINDEX],
  ["blog page 2", "/" + BUILT + "/blog/page/2", NOINDEX],
  ["post", "/" + BUILT + "/blog/" + postSlug, NOINDEX],
]

let failed = 0
const note = (msg) => {
  if (REPORT_ONLY) {
    console.log("warn  " + msg + "  (--report-only)")
  } else {
    console.error("FAIL  " + msg)
    failed++
  }
}

for (const [label, path, expectedSeoFailures] of ROUTES) {
  const out = resolve(root, ".tmp-lh-" + label.replace(/\W+/g, "-") + ".json")
  /* execSync, not execFileSync: npx is a `.cmd` shim on Windows and Node
     refuses to spawn one directly (EINVAL). Every interpolated value here is
     either a literal or a URL this script built from ORIGIN. */
  const cmd =
    `npx --yes lighthouse@12 "${ORIGIN + path}" --quiet --output=json ` +
    `--output-path="${out}" --form-factor=mobile ` +
    `--chrome-flags="--headless=new --no-sandbox"`
  try {
    execSync(cmd, { stdio: ["ignore", "ignore", "pipe"], cwd: root })
  } catch (err) {
    /* Never swallow the failure — a silent catch here turns "Lighthouse could
       not run" into "the budget passed", which is worse than a red build. */
    console.error("FAIL  " + label + ": lighthouse did not complete")
    console.error(String(err.stderr ?? err).slice(0, 400))
    failed++
    continue
  }

  const lhr = JSON.parse(readFileSync(out, "utf8"))
  rmSync(out, { force: true })

  const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100)
  const line = ROUTES.length > 0 ? label.padEnd(12) : label
  const scores = `perf ${String(score("performance")).padStart(3)}  a11y ${String(
    score("accessibility"),
  ).padStart(3)}  bp ${String(score("best-practices")).padStart(3)}  seo ${String(
    score("seo"),
  ).padStart(3)}`

  const under = Object.entries(MIN).filter(([k, min]) => score(k) < min)

  /* The SEO assertion §2.4 makes necessary. `notApplicable` and `informative`
     audits have a null score and are not failures. */
  const seoFailures = (lhr.categories.seo?.auditRefs ?? [])
    .map((ref) => lhr.audits[ref.id])
    .filter((a) => a && a.score !== null && a.score < 1)
    .map((a) => a.id)
  const unexpectedSeo = seoFailures.filter((id) => !expectedSeoFailures.has(id))
  const missingSeo = [...expectedSeoFailures].filter((id) => !seoFailures.includes(id))

  if (under.length === 0 && unexpectedSeo.length === 0 && missingSeo.length === 0) {
    console.log(`ok    ${line}  ${scores}`)
    continue
  }

  console.log(`      ${line}  ${scores}`)
  for (const [k, min] of under) note(`${label}: ${k} ${score(k)} < ${min}`)
  if (unexpectedSeo.length > 0) {
    /* Not report-only — this one is an isolation regression, not a timing
       artifact, and it fails regardless of the flag. */
    console.error(`FAIL  ${label}: unexpected SEO audit failure — ${unexpectedSeo.join(", ")}`)
    failed++
  }
  if (missingSeo.length > 0) {
    console.error(
      `FAIL  ${label}: ${missingSeo.join(", ")} PASSED — the route is crawlable. ` +
        "docs/product.md §2.4 requires noindex on every persona route.",
    )
    failed++
  }
}

if (failed > 0) {
  console.error(`\n${failed} budget assertion(s) failed.`)
  process.exit(1)
}
console.log(
  REPORT_ONLY
    ? `\nBudget swept ${ROUTES.length} routes (--report-only: thresholds warned, not enforced).`
    : `\nAll budget assertions passed across ${ROUTES.length} routes.`,
)
