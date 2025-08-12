"use client"

import { useEffect } from "react"

/**
 * OverlayCleaner removes duplicate portal/toaster nodes that can appear after hot reloads
 * or navigation, preventing stacked backdrops/overlays.
 */
export function OverlayCleaner() {
  useEffect(() => {
    try {
      // Deduplicate sonner toasters if multiple were mounted accidentally
      const sonners = Array.from(document.querySelectorAll("[data-sonner-toaster]"))
      if (sonners.length > 1) {
        sonners.slice(1).forEach((n) => n.parentElement?.removeChild(n))
      }

      // Deduplicate Radix portals if any were leaked
      const radixPortals = Array.from(document.querySelectorAll("[data-radix-portal]"))
      if (radixPortals.length > 1) {
        radixPortals.slice(1).forEach((n) => n.parentElement?.removeChild(n))
      }
    } catch {
      // no-op: safe failure
    }
  }, [])

  return null
}
