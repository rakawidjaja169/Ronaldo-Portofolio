/**
 * Typography — docs/design-system.md §2
 *
 * next/font/google downloads these at build time and serves them from our own
 * origin. There is no runtime request to Google: self-hosted in effect, without
 * checking font binaries into the repo.
 */
import { Archivo, JetBrains_Mono, Space_Grotesk } from "next/font/google"

/** Display / headings. Wide grotesk, editorial weight. */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-archivo",
  display: "swap",
})

/** Body. Distinct enough to feel designed, calm enough for long-form. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-space-grotesk",
  display: "swap",
})

/** Meta, tags, timeline years, code. Carries the tabular figures. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const fontVariables = [archivo.variable, spaceGrotesk.variable, jetbrainsMono.variable].join(
  " ",
)
