/**
 * Pre-paint theme resolution.
 *
 * This runs synchronously in <head>, before first paint, so the correct theme
 * is on <html> before any pixel is drawn. Without it the page paints dark, then
 * flips to light on hydration — the flash-of-wrong-theme.
 *
 * It cannot be a React effect: effects run after paint, which is exactly too late.
 *
 * localStorage access throws in some privacy modes, so the whole body is
 * wrapped: a storage failure must fall back to the system preference, never
 * leave the document unthemed.
 */
export const THEME_STORAGE_KEY = "theme"

const script = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />
}
