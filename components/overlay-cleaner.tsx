"use client"

import { useEffect } from "react"

export function OverlayCleaner() {
  useEffect(() => {
    const removeOverlays = () => {
      // Common selectors for feedback widgets and overlays
      const selectors = [
        // Nolt feedback widget
        "[data-nolt-widget]",
        ".nolt-widget",
        "#nolt-widget",
        // Generic bottom-left circular buttons
        'div[style*="position: fixed"][style*="bottom"][style*="left"]',
        'div[style*="position:fixed"][style*="bottom"][style*="left"]',
        // Common feedback widget patterns
        ".feedback-widget",
        ".feedback-button",
        '[id*="feedback"]',
        '[class*="feedback"]',
        // Intercom and similar
        ".intercom-launcher",
        "#intercom-container",
        // Generic floating action buttons in bottom corners
        'button[style*="position: fixed"][style*="bottom"]',
        'a[style*="position: fixed"][style*="bottom"]',
      ]

      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.display = "none"
              el.remove()
            }
          })
        } catch (e) {
          // Ignore selector errors
        }
      })

      // Additional heuristic: find circular buttons in bottom-left
      const allDivs = document.querySelectorAll("div")
      allDivs.forEach((div) => {
        const style = window.getComputedStyle(div)
        const rect = div.getBoundingClientRect()

        if (
          style.position === "fixed" &&
          Number.parseInt(style.bottom) >= 0 &&
          Number.parseInt(style.bottom) <= 100 &&
          Number.parseInt(style.left) >= 0 &&
          Number.parseInt(style.left) <= 100 &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.width <= 80 &&
          rect.height <= 80 &&
          (style.borderRadius.includes("50%") ||
            style.borderRadius.includes("100%") ||
            Number.parseInt(style.borderRadius) >= Math.min(rect.width, rect.height) / 2)
        ) {
          div.style.display = "none"
          div.remove()
        }
      })
    }

    // Run immediately
    removeOverlays()

    // Run periodically to catch dynamically injected widgets
    const interval = setInterval(removeOverlays, 1000)

    // Run on DOM changes
    const observer = new MutationObserver(removeOverlays)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  return null
}
