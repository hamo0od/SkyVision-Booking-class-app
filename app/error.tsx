"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">Something went wrong!</CardTitle>
          <CardDescription className="text-gray-600">An error occurred while processing your request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show detailed error information */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
            <p className="text-sm text-red-700 font-mono break-words">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
