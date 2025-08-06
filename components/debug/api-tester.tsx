"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toolRequestsApi, checkoutsApi, checkinRequestsApi, testToolApis } from "@/lib/api-debug"

export function ApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (endpoint: string, status: "success" | "error", data: any) => {
    const result = {
      id: Date.now(),
      endpoint,
      status,
      data,
      timestamp: new Date().toISOString(),
    }
    setResults((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10 results
  }

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setIsLoading(true)
    try {
      console.log(`🧪 Testing ${name}...`)
      const data = await apiCall()
      addResult(name, "success", data)
      console.log(`✅ ${name} succeeded:`, data)
    } catch (error) {
      addResult(name, "error", error)
      console.error(`❌ ${name} failed:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    console.log("🚀 Running all API tests...")
    try {
      await testToolApis()
    } catch (error) {
      console.error("❌ Test suite failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 API Endpoint Tester</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test tool management API endpoints and view responses in the console
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tool Requests */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tool Requests</h3>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => testEndpoint("GET /api/tools/requests", toolRequestsApi.getAll)}
                  disabled={isLoading}
                >
                  GET Requests
                </Button>
              </div>
            </div>

            {/* Tool Checkouts */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tool Checkouts</h3>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => testEndpoint("GET /api/tools/checkouts", checkoutsApi.getAll)}
                  disabled={isLoading}
                >
                  GET All Checkouts
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => testEndpoint("GET /api/tools/checkouts/my", checkoutsApi.getMy)}
                  disabled={isLoading}
                >
                  GET My Checkouts
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => testEndpoint("GET /api/tools/checkouts/overdue", checkoutsApi.getOverdue)}
                  disabled={isLoading}
                >
                  GET Overdue
                </Button>
              </div>
            </div>

            {/* Check-in Requests */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Check-in Requests</h3>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => testEndpoint("GET /api/tools/checkin-requests", checkinRequestsApi.getAll)}
                  disabled={isLoading}
                >
                  GET Check-in Requests
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={isLoading} className="flex-1">
              {isLoading ? "Testing..." : "🚀 Run All Tests"}
            </Button>
            <Button variant="outline" onClick={() => setResults([])}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono">{result.endpoint}</code>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === "success" ? "default" : "destructive"}>{result.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Console Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Console Logging</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Open your browser's developer console (F12) to see detailed API logs:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>🚀 Request details (URL, method, body)</li>
              <li>📥 Response data and status codes</li>
              <li>❌ Error details and stack traces</li>
              <li>⏱️ Request duration timing</li>
              <li>📋 Expected response formats</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
