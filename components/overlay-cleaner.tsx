"use client"

import { useEffect } from "react"

/**
 * OverlayCleaner removes common third-party floating widgets like
 * feedback/chat launchers anchored at the bottom-left (e.g., a red "N" button).
 *
 * It:
 * - Targets known providers by selector (Nolt, Intercom, Crisp, general iframes)
 * - Falls back to a generic heuristic for a fixed circular button at bottom-left
 * - Watches DOM mutations to catch widgets injected after page load
 */
export default function OverlayCleaner() {
  useEffect(() => {
    const knownSelectors = [
      // Nolt feedback widget
      "#nolt-widget",
      '[id*="nolt"]',
      '[class*="nolt"]',
      'iframe[title="Nolt"]',
      'iframe[src*="nolt.io"]',
      // A few common launchers, just in case
      ".intercom-lightweight-app",
      ".intercom-container",
      'iframe[src*="intercom."]',
      "#crisp-chatbox",
      'iframe[src*="crisp.chat"]',
      'iframe[src*="crisp.chat"]',
      "[data-crisp]",
      '[data-testid*="widget"]',
    ]

    const hide = (el: Element | null) => {
      if (!el) return
      const node = el as HTMLElement
      node.style.setProperty("display", "none", "important")
      node.style.setProperty("visibility", "hidden", "important")
      node.setAttribute("aria-hidden", "true")
    }

    const hideKnown = () => {
      for (const sel of knownSelectors) {
        document.querySelectorAll(sel).forEach(hide)
      }
    }

    const within = (val: number, max: number) => !Number.isNaN(val) && val <= max

    const findBottomLeftFixedCandidates = (): HTMLElement[] => {
      const all = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      const results: HTMLElement[] = []
      for (const el of all) {
        try {
          const s = window.getComputedStyle(el)
          if (s.position !== "fixed") continue

          // Parse bottom/left if set; treat missing as large
          const bottom = Number.parseFloat(s.bottom || "9999")
          const left = Number.parseFloat(s.left || "9999")
          if (!within(bottom, 48) || !within(left, 48)) continue

          const w = el.offsetWidth
          const h = el.offsetHeight
          if (w < 36 || h < 36 || w > 140 || h > 140) continue

          const radius = s.borderRadius || ""
          const circular =
            radius.includes("%") || radius.split(" ").some((v) => Number.parseFloat(v) >= Math.min(w, h) / 2 - 2)

          const hasSingleN = (el.textContent || "").trim() === "N" || (el.getAttribute("title") || "").trim() === "N"

          if (circular || hasSingleN) {
            results.push(el)
          }
        } catch {
          // ignore
        }
      }
      return results
    }

    const hideGeneric = () => {
      const candidates = findBottomLeftFixedCandidates()
      for (const el of candidates) {
        // Hide the element
        hide(el)
        // Also hide a fixed parent wrapper if present
        const p = el.parentElement
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

    // Initial try
    clean()

    // MutationObserver for async-injected widgets
    const observer = new MutationObserver(() => {
      clean()
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    // A short retry loop for late injections
    const timeouts: number[] = []
    ;[250, 800, 1500, 2500].forEach((ms) => {
      const id = window.setTimeout(clean, ms)
      timeouts.push(id)
    })

    return () => {
      observer.disconnect()
      timeouts.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  // Renders nothing
  return null
}
