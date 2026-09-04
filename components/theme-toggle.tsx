"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { THEME_STORAGE_KEY } from "@/components/theme-script"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark"

/**
 * Theme toggle.
 *
 * Deliberately not next-themes: that package solves multi-theme SSR generally,
 * and this needs two themes and one attribute. The pre-paint script in
 * theme-script.tsx already did the hard part.
 *
 * The icon renders as an invisible placeholder until mount. The server cannot
 * know the client's theme, so rendering a real icon during SSR guarantees a
 * hydration mismatch; reserving the space avoids both the mismatch and a
 * layout shift.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme")
    setTheme(current === "light" ? "light" : "dark")
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage blocked (private mode). The theme still applies for this
      // session; only persistence is lost.
    }
  }

  const label = mounted
    ? `Switch to ${theme === "dark" ? "light" : "dark"} theme`
    : "Switch color theme"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-full",
        "border border-border bg-surface text-ink-muted",
        "transition-colors duration-150 hover:bg-surface-2 hover:text-ink",
        "active:scale-97",
        className,
      )}
    >
      {/* aria-hidden: the button's own label already announces the action. */}
      <span aria-hidden="true" className={cn("transition-opacity", !mounted && "opacity-0")}>
        {theme === "dark" ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
      </span>
    </button>
  )
}
