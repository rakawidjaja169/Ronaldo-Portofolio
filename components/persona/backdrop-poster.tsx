/**
 * Hero backdrop — docs/design-system.md §5.
 *
 * The WebGL field is deferred until after M8 settles the LCP budget against a
 * real host (see docs/roadmap.md M2). This poster is not a stand-in for it:
 * §5 requires exactly this as the rendered output in every skip case —
 * reduced motion, failed context creation, `hardwareConcurrency <= 4`, or
 * `saveData` — so it ships either way and stays once the canvas exists.
 *
 * Pure CSS and SVG, no client JS. Nothing animates, so reduced motion needs no
 * branch: there is nothing to reduce.
 *
 * `aria-hidden` and `pointer-events-none`: decorative, and it must never take
 * a tap meant for the CTA sitting above it.
 */
export function BackdropPoster() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: "var(--z-base)" }}
    >
      {/*
        Two offset accent washes rather than one centered glow — a single
        radial reads as a vignette artifact, two reads as light. Both use
        --accent-quiet, so this is a tint and not the accent-as-background-wash
        that §9 rejects.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 78% 18%, var(--accent-quiet), transparent 70%), radial-gradient(45% 40% at 12% 82%, var(--accent-quiet), transparent 72%)",
        }}
      />

      {/*
        Grain. feTurbulence rendered once into a data URI: an inline <svg>
        filter would be re-rasterized on every repaint of the sticky nav
        overlapping it. Opacity is deliberately low — visible as texture at
        100%, invisible as noise.
      */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Fades the field into the page so the hero has no hard bottom edge. */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-base" />
    </div>
  )
}
