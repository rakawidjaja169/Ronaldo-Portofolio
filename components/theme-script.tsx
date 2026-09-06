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
 * wrapped: a storage failure must still theme the document, never leave it
 * unthemed.
 *
 * IT DOES NOT READ prefers-color-scheme, AND THAT IS THE SPEC.
 * docs/design-system.md §1.1 names dark "the default theme" outright — not
 * "the default on a dark system". A matchMedia fallback lived here until M7
 * and handed a light-OS visitor a light first paint, which is a different
 * default from the one the doc states. tests/homepage.mjs's `[theme]` group
 * asserts the dark default under prefers-color-scheme: light specifically so
 * this cannot drift back in unnoticed; the assertion that ran before it was
 * vacuous, because its context was already dark.
 */
export const THEME_STORAGE_KEY = "theme"

const script = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />
}
