import { ImageResponse } from "next/og"

import { site } from "@/content/site"

export const alt = `${site.name} — portfolio`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Open Graph card.
 *
 * The one documented exception to "no raw hex in components"
 * (design-system.md §1.4). ImageResponse renders through Satori, outside the
 * CSS cascade — there is no :root, no var(), no Tailwind. Values below are
 * copied from the dark theme in app/globals.css, which remains the source of
 * truth; if a token changes there, change it here too.
 *
 * Static route, so this is generated once at build and served as a file.
 */
const COLORS = {
  base: "#1F1F1F",
  ink: "#F5F5F5",
  inkMuted: "#A3A3A3",
  accent: "#FF914D",
} as const

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.base,
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", width: 120, height: 6, backgroundColor: COLORS.accent }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 128,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: COLORS.ink,
              fontWeight: 700,
            }}
          >
            {site.name}
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: COLORS.inkMuted, maxWidth: 900 }}>
            {site.positioning}
          </div>
        </div>

        <div style={{ fontSize: 26, color: COLORS.accent }}>{site.location}</div>
      </div>
    ),
    size,
  )
}
