/**
 * Cache Management Utilities
 * Handles clearing browser cache, localStorage, sessionStorage, and forcing data refresh
 */

export class CacheManager {
  /**
   * Clear all browser storage and cached data
   */
  static async clearAllCache(): Promise<void> {
    try {
      console.log("🧹 Starting complete cache cleanup...")

      // 1. Clear localStorage
      if (typeof localStorage !== "undefined") {
        const localStorageKeys = Object.keys(localStorage)
        console.log("📦 Clearing localStorage keys:", localStorageKeys)
        localStorage.clear()
      }

      // 2. Clear sessionStorage
      if (typeof sessionStorage !== "undefined") {
        const sessionStorageKeys = Object.keys(sessionStorage)
        console.log("📦 Clearing sessionStorage keys:", sessionStorageKeys)
        sessionStorage.clear()
      }

      // 3. Clear cookies (if possible)
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";")
        console.log("🍪 Clearing cookies:", cookies.length)

        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          // Clear cookie by setting expiration to past date
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        })
      }

      // 4. Clear browser cache (if service worker is available)
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        console.log("🔧 Clearing service workers:", registrations.length)

        for (const registration of registrations) {
          await registration.unregister()
        }
      }

      // 5. Clear cache storage
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        console.log("💾 Clearing cache storage:", cacheNames)

        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      }

      // 6. Clear IndexedDB (if available)
      if ("indexedDB" in window) {
        try {
          // This is a more complex operation, so we'll just log it
          console.log("🗄️ IndexedDB detected - consider manual clearing if needed")
        } catch (error) {
          console.warn("⚠️ Could not clear IndexedDB:", error)
        }
      }

      console.log("✅ Cache cleanup completed successfully!")
    } catch (error) {
      console.error("❌ Error during cache cleanup:", error)
      throw error
    }
  }

  /**
   * Clear only authentication-related data
   */
  static clearAuthCache(): void {
    console.log("🔐 Clearing authentication cache...")

    if (typeof localStorage !== "undefined") {
      // Remove auth-related keys
      const authKeys = ["auth_token", "user_data", "refresh_token", "session_id", "user_preferences", "login_timestamp"]

      authKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          console.log(`🗑️ Removing localStorage key: ${key}`)
          localStorage.removeItem(key)
        }
      })
    }

    if (typeof sessionStorage !== "undefined") {
      // Remove session auth data
      const sessionKeys = ["temp_auth", "session_data", "user_session"]

      sessionKeys.forEach((key) => {
        if (sessionStorage.getItem(key)) {
          console.log(`🗑️ Removing sessionStorage key: ${key}`)
          sessionStorage.removeItem(key)
        }
      })
    }

    console.log("✅ Authentication cache cleared!")
  }

  /**
   * Clear API response cache
   */
  static clearApiCache(): void {
    console.log("🌐 Clearing API cache...")

    if (typeof localStorage !== "undefined") {
      const apiKeys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith("api_") ||
          key.startsWith("cache_") ||
          key.includes("requests") ||
          key.includes("materials") ||
          key.includes("tools") ||
          key.includes("users"),
      )

      console.log("📡 Removing API cache keys:", apiKeys)
      apiKeys.forEach((key) => localStorage.removeItem(key))
    }

    console.log("✅ API cache cleared!")
  }

  /**
   * Force reload the page with cache bypass
   */
  static forceReload(): void {
    console.log("🔄 Force reloading page with cache bypass...")

    if (typeof window !== "undefined") {
      // Force reload bypassing cache
      window.location.reload()
    }
  }

  /**
   * Complete cache clear and reload
   */
  static async clearAllAndReload(): Promise<void> {
    await this.clearAllCache()

    // Small delay to ensure cleanup completes
    setTimeout(() => {
      this.forceReload()
    }, 500)
  }

  /**
   * Get cache status information
   */
  static getCacheStatus(): {
    localStorage: number
    sessionStorage: number
    cookies: number
    hasServiceWorker: boolean
    hasCacheAPI: boolean
  } {
    const status = {
      localStorage: 0,
      sessionStorage: 0,
      cookies: 0,
      hasServiceWorker: "serviceWorker" in navigator,
      hasCacheAPI: "caches" in window,
    }

    if (typeof localStorage !== "undefined") {
      status.localStorage = Object.keys(localStorage).length
    }

    if (typeof sessionStorage !== "undefined") {
      status.sessionStorage = Object.keys(sessionStorage).length
    }

    if (typeof document !== "undefined") {
      status.cookies = document.cookie.split(";").filter((c) => c.trim()).length
    }

    return status
  }
}

// Utility functions for easy access
export const clearAllCache = () => CacheManager.clearAllCache()
export const clearAuthCache = () => CacheManager.clearAuthCache()
export const clearApiCache = () => CacheManager.clearApiCache()
export const forceReload = () => CacheManager.forceReload()
export const clearAllAndReload = () => CacheManager.clearAllAndReload()
export const getCacheStatus = () => CacheManager.getCacheStatus()
