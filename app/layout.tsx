import type { Metadata, Viewport } from "next"

import { ThemeScript } from "@/components/theme-script"
import { env } from "@/lib/env"
import { fontVariables } from "@/lib/fonts"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Ronaldo Katriel",
    template: "%s — Ronaldo Katriel",
  },
  description: "Portfolio of Ronaldo Katriel.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximum-scale / user-scalable: pinch-zoom must never be disabled (§7).
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: ThemeScript mutates data-theme before React
    // hydrates, so the server and client markup differ here by design.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={fontVariables}>{children}</body>
    </html>
  )
}
