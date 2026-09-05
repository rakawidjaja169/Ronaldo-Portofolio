import { RevealGroup, RevealItem } from "@/components/ui/reveal"
import type { SkillGroup } from "@/content/skills"

/**
 * Grouped competencies — docs/product.md §5.1, docs/design-system.md §6.
 *
 * Server component. The chips reuse the §6 `TagChip` visual that work-grid.tsx's
 * `FilterChip` establishes — mono uppercase, `--accent-quiet` fill — but as
 * plain `<li>`, never buttons. These do not filter anything, and a 44px target
 * that does nothing when pressed is a §7 defect, not a smaller one than an
 * unlabelled control.
 *
 * `<h3>` under the section's `<h2>`, no level skipped (§7).
 */
export function SkillGroups({ groups }: { groups: readonly SkillGroup[] }) {
  if (groups.length === 0) return null

  return (
    <RevealGroup as="div" className="mt-12 grid gap-10 sm:grid-cols-2">
      {groups.map((group) => (
        <RevealItem as="div" key={group.label}>
          <h3 className="font-mono text-meta uppercase tracking-wide text-ink-muted">
            {group.label}
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {group.items.map((item) => (
              <li
                key={item}
                className="inline-flex items-center rounded-sm bg-accent-quiet px-3 py-1.5 font-mono text-meta uppercase text-accent-text"
              >
                {item}
              </li>
            ))}
          </ul>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
