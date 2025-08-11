"use client"

import { useEffect } from "react"

/**
 * OverlayCleaner
 * Safely cleans up any transient body styles that might be left by modals/sheets after redirects or forced logouts.
 * Hides common 3rd‑party floating launchers (e.g., Nolt, Intercom) that appear bottom-left
 * and may inject after hydration. Runs only on the client.
 */
export default function OverlayCleaner() {
  useEffect(() => {
    // Remove potential body locks (common with dialogs/sheets)
    document.documentElement.style.removeProperty("overflow")
    document.body.style.removeProperty("overflow")
    document.body.style.removeProperty("paddingRight")

    const css = `
      /* Known providers */
      #nolt-wrapper, .nolt-launcher, [data-nolt], iframe[src*="nolt.io"] { display: none !important; visibility: hidden !important; }
      .intercom-lightweight-app, #intercom-container, .intercom-launcher, iframe[src*="intercom.io"] { display: none !important; visibility: hidden !important; }
      #beamerContainer, .beamer_button, iframe[src*="getbeamer.com"] { display: none !important; visibility: hidden !important; }
      .crisp-client, #crisp-chatbox { display: none !important; visibility: hidden !important; }

      /* Generic bottom-left fixed round button heuristic */
      .__v0-hide-overlay, 
      button[style*="position: fixed"][style*="left:"][style*="bottom"], 
      a[style*="position: fixed"][style*="left:"][style*="bottom"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `
    const style = document.createElement("style")
    style.setAttribute("data-overlay-cleaner", "true")
    style.textContent = css
    document.head.appendChild(style)

    const hideMatches = () => {
      const selectors = [
        "#nolt-wrapper",
        ".nolt-launcher",
        "[data-nolt]",
        'iframe[src*="nolt.io"]',
        ".intercom-lightweight-app",
        "#intercom-container",
        ".intercom-launcher",
        'iframe[src*="intercom.io"]',
        "#beamerContainer",
        ".beamer_button",
        'iframe[src*="getbeamer.com"]',
        ".crisp-client",
        "#crisp-chatbox",
      ]
      selectors.forEach((sel) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.setProperty("display", "none", "important")
          el.style.setProperty("visibility", "hidden", "important")
          el.style.setProperty("pointerEvents", "none", "important")
        })
      })
    }

    hideMatches()

    const observer = new MutationObserver(() => hideMatches())
    observer.observe(document.documentElement, { childList: true, subtree: true })

    const interval = window.setInterval(hideMatches, 1000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
      style.remove()
    }
  }, [])

  return null
}
