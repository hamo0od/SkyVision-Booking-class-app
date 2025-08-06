"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trash2, RefreshCw, Database, Key, Globe, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { CacheManager } from "@/lib/cache-manager"

export function CacheCleaner() {
  const [isClearing, setIsClearing] = useState(false)
  const [lastCleared, setLastCleared] = useState<string | null>(null)
  const [cacheStatus, setCacheStatus] = useState(CacheManager.getCacheStatus())

  const updateCacheStatus = () => {
    setCacheStatus(CacheManager.getCacheStatus())
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      await CacheManager.clearAllCache()
      setLastCleared(new Date().toLocaleTimeString())
      updateCacheStatus()

      // Show success message
      console.log("✅ All cache cleared successfully!")

      // Optional: Reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("❌ Error clearing cache:", error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearAuth = () => {
    CacheManager.clearAuthCache()
    setLastCleared(new Date().toLocaleTimeString())
    updateCacheStatus()
  }

  const handleClearApi = () => {
    CacheManager.clearApiCache()
    setLastCleared(new Date().toLocaleTimeString())
    updateCacheStatus()
  }

  const handleForceReload = () => {
    CacheManager.forceReload()
  }

  const handleClearAllAndReload = async () => {
    setIsClearing(true)
    await CacheManager.clearAllAndReload()
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>Clear browser cache, storage, and force refresh application data</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cache Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Current Cache Status
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-bold">{cacheStatus.localStorage}</div>
              <div className="text-xs text-muted-foreground">localStorage</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-bold">{cacheStatus.sessionStorage}</div>
              <div className="text-xs text-muted-foreground">sessionStorage</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-bold">{cacheStatus.cookies}</div>
              <div className="text-xs text-muted-foreground">Cookies</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-bold">{cacheStatus.hasServiceWorker ? "✅" : "❌"}</div>
              <div className="text-xs text-muted-foreground">Service Worker</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Actions</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={handleClearAuth} variant="outline" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Clear Auth Data
            </Button>

            <Button onClick={handleClearApi} variant="outline" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Clear API Cache
            </Button>

            <Button onClick={handleForceReload} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Force Reload
            </Button>

            <Button onClick={updateCacheStatus} variant="outline" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        </div>

        <Separator />

        {/* Nuclear Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Nuclear Options
          </h4>

          <div className="space-y-2">
            <Button
              onClick={handleClearAll}
              disabled={isClearing}
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isClearing ? "Clearing All Cache..." : "Clear All Cache"}
            </Button>

            <Button
              onClick={handleClearAllAndReload}
              disabled={isClearing}
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {isClearing ? "Clearing & Reloading..." : "Clear All & Reload"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ These actions will clear ALL browser data and may log you out
          </p>
        </div>

        {/* Last Cleared Info */}
        {lastCleared && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Last cleared: {lastCleared}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
