"use client"

import { useEffect } from "react"

/**
 * OverlayCleaner hides common third‑party floating widgets anchored at the bottom‑left,
 * like the red "N" button shown in the screenshot. It targets known selectors (e.g., Nolt)
 * and falls back to a safe heuristic for fixed circular buttons in the bottom-left corner.
 *
 * Runs after hydration (useEffect) so it won't cause SSR/CSR mismatches.
 */
export default function OverlayCleaner() {
  useEffect(() => {
    const knownSelectors = [
      // Nolt feedback widget variants
      "#nolt-widget",
      "[data-nolt-widget]",
      '[id*="nolt"]',
      '[class*="nolt"]',
      'iframe[title="Nolt"]',
      'iframe[src*="nolt.io"]',

      // Other common widget containers (defensive)
      ".intercom-lightweight-app",
      ".intercom-container",
      'iframe[src*="intercom."]',
      "#crisp-chatbox",
      "[data-crisp]",
      'iframe[src*="crisp.chat"]',
      '[data-testid*="widget"]',
    ]

    const hide = (el: Element | null) => {
      if (!el) return
      const node = el as HTMLElement
      node.style.setProperty("display", "none", "important")
      node.style.setProperty("visibility", "hidden", "important")
      node.style.setProperty("pointer-events", "none", "important")
      node.setAttribute("aria-hidden", "true")
    }

    const hideKnown = () => {
      for (const sel of knownSelectors) {
        document.querySelectorAll(sel).forEach(hide)
      }
    }

    // Basic bounds/shape checks for a fixed circular button at bottom-left
    const findBottomLeftFixedCandidates = (): HTMLElement[] => {
      const results: HTMLElement[] = []
      const all = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      for (const el of all) {
        try {
          const s = window.getComputedStyle(el)
          if (s.position !== "fixed") continue

          const bottom = Number.parseFloat(s.bottom || "9999")
          const left = Number.parseFloat(s.left || "9999")
          if (Number.isNaN(bottom) || Number.isNaN(left)) continue
          if (bottom > 56 || left > 56) continue

          const w = el.offsetWidth
          const h = el.offsetHeight
          if (w < 36 || h < 36 || w > 160 || h > 160) continue

          const radius = s.borderRadius || ""
          const circular =
            radius.includes("%") || radius.split(" ").some((v) => Number.parseFloat(v) >= Math.min(w, h) / 2 - 3)

          const hasSingleN = (el.textContent || "").trim() === "N" || (el.getAttribute("title") || "").trim() === "N"

          if (circular || hasSingleN) {
            results.push(el)
          }
        } catch {
          // ignore cross-origin or transient style issues
        }
      }
      return results
    }

    const hideGeneric = () => {
      const candidates = findBottomLeftFixedCandidates()
      for (const el of candidates) {
        hide(el)
        // Hide fixed parent wrapper if present
        const p: HTMLElement | null = el.parentElement
        if (p) {
          const ps = window.getComputedStyle(p)
          if (ps.position === "fixed") hide(p)
        }
      }
    }

    const clean = () => {
      hideKnown()
      hideGeneric()
    }

    // Initial run
    clean()

    // Watch for async-injected widgets
    const observer = new MutationObserver(clean)
    observer.observe(document.documentElement, { childList: true, subtree: true })

    // A few retries for late injections
    const timers = [250, 800, 1500, 2500].map((ms) => window.setTimeout(clean, ms))

    return () => {
      observer.disconnect()
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return null
}
