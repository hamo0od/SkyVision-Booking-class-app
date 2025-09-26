"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("Global application error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Something went wrong!</CardTitle>
              <CardDescription className="text-gray-600">A critical error occurred in the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error.message && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-1">Error Details:</h4>
                  <p className="text-sm text-red-700">{error.message}</p>
                  {error.digest && <p className="text-xs text-red-600 mt-1">Error ID: {error.digest}</p>}
                  {error.stack && process.env.NODE_ENV === "development" && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={reset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
