import { TimelineRail } from "@/components/persona/timeline-rail"
import { RevealGroup, RevealItem } from "@/components/ui/reveal"
import type { ExperienceEntry } from "@/content/experience"

/**
 * Career timeline — docs/product.md §5.1, docs/design-system.md §6, §4.3.
 *
 * A SERVER COMPONENT. `RevealGroup`/`RevealItem` and `TimelineRail` are client
 * components that pass their children straight through, so every role, org,
 * date and bullet below is in the SSR markup — the same arrangement
 * work-grid.tsx already depends on. Nothing here needs state.
 *
 * `<ol>` because the entries are ordered and that order is the meaning (§6).
 * `<h3>` under the section's `<h2>`, no level skipped (§7).
 *
 * Years are mono tabular figures (§2.2) so the column does not jitter between
 * entries — the reason that rule exists is exactly this list.
 */

/**
 * "2023-03" → "Mar 2023"; "2018" → "2018"; null → "Present".
 *
 * Deliberately not `toLocaleDateString`: this renders on the server and again
 * on the client, and a locale mismatch between the two is a hydration error.
 * Fixed English month names cannot drift.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDate(value: string | null): string {
  if (value === null) return "Present"
  const [year, month] = value.split("-")
  if (!month) return year ?? value
  return `${MONTHS[Number(month) - 1] ?? month} ${year}`
}

export function Timeline({ entries }: { entries: readonly ExperienceEntry[] }) {
  if (entries.length === 0) return null

  return (
    <div className="mt-12">
      <TimelineRail>
        <RevealGroup as="ol" className="flex flex-col gap-10">
          {entries.map((entry) => (
            <RevealItem
              as="li"
              key={`${entry.org}-${entry.start}`}
              /*
                Enters FROM the rail (§4.3), i.e. from the left — which is a
                negative x offset, and `axis="right"` is the variant that
                starts there. `axis="left"` starts at +24px and, at 375px,
                pushes every entry past the right edge until it reveals: a
                4px horizontal scroll that the [overflow] group catches.
              */
              axis="right"
              className="relative pl-8"
            >
              {/* Node on the rail. Decoration: the <li> is what conveys "an entry". */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.45rem] size-[7px] rounded-full bg-accent"
              />

              <p className="font-mono text-meta uppercase tabular-nums text-ink-muted">
                {formatDate(entry.start)} — {formatDate(entry.end)}
              </p>
              <h3 className="mt-1.5 font-display text-h3 font-semibold">{entry.role}</h3>
              <p className="mt-1 text-body-s text-ink-muted">{entry.org}</p>

              {entry.points.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {entry.points.map((point) => (
                    <li key={point} className="relative pl-5 text-body text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-[0.7em] size-1 rounded-full bg-ink-faint"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
            </RevealItem>
          ))}
        </RevealGroup>
      </TimelineRail>
    </div>
  )
}
