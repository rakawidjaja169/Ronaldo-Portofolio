import { ThemeToggle } from "@/components/theme-toggle"

/**
 * M0 placeholder.
 *
 * Exists so the foundation is runnable and the theme system is verifiable.
 * Replaced wholesale by the real homepage in M1 (docs/roadmap.md).
 */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-page flex-col justify-center gap-8 px-inset py-section">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-meta uppercase text-ink-muted">Foundation · M0</p>
          <h1 className="mt-3 text-display-l font-display">Ronaldo Katriel</h1>
        </div>
        <ThemeToggle />
      </header>

      <p className="max-w-[65ch] text-body-l text-ink-muted">
        Design tokens, typography, motion presets, and theming are in place. The homepage
        arrives in M1.
      </p>

      <ul className="flex flex-wrap gap-3" aria-label="Theme surface swatches">
        {[
          ["base", "bg-base"],
          ["surface", "bg-surface"],
          ["surface-2", "bg-surface-2"],
          ["surface-3", "bg-surface-3"],
        ].map(([name, bg]) => (
          <li
            key={name}
            className={`${bg} rounded-md border border-border px-4 py-3 font-mono text-meta uppercase text-ink-muted`}
          >
            {name}
          </li>
        ))}
      </ul>
    </main>
  )
}
