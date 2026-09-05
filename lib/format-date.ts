/**
 * "2026-08-14" → "14 Aug 2026". Two callers: the blog card and the post header.
 *
 * DELIBERATELY NOT `toLocaleDateString` — the same rule already written out at
 * components/persona/timeline.tsx:29. These strings render on the server and
 * again on the client, and a locale mismatch between the two is a hydration
 * error. A fixed English month table cannot drift.
 *
 * Not shared with timeline's own formatter: that one takes "2023-03" and emits
 * "Mar 2023" with a `null` → "Present" case. Merging them would produce one
 * function with two shapes and a flag, which is worse than two of four lines.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatPostDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  if (!month || !day) return iso
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? month} ${year}`
}
