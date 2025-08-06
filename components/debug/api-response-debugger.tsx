"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ApiResponseDebugger() {
  const [endpoint, setEndpoint] = useState("/aircraft-types")
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}${endpoint}`
      console.log(`Fetching from: ${url}`)

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          // Add auth token if available
          ...(typeof localStorage !== "undefined" && localStorage.getItem("auth_token")
            ? { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            : {}),
        },
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const text = await res.text()
      console.log("Raw response:", text)

      try {
        const data = JSON.parse(text)
        setResponse(data)

        // Log detailed information about the response
        console.log("Response type:", typeof data)
        if (Array.isArray(data)) {
          console.log("Response is an array with", data.length, "items")
          if (data.length > 0) {
            console.log("First item:", data[0])
          }
        } else if (typeof data === "object" && data !== null) {
          console.log("Response is an object with keys:", Object.keys(data))
          if ("data" in data) {
            console.log(
              "Has 'data' property:",
              typeof data.data,
              Array.isArray(data.data) ? `(array with ${data.data.length} items)` : "",
            )
          }
          if ("items" in data) {
            console.log(
              "Has 'items' property:",
              typeof data.items,
              Array.isArray(data.items) ? `(array with ${data.items.length} items)` : "",
            )
          }
        }
      } catch (e) {
        console.error("Error parsing JSON:", e)
        setError(`Invalid JSON response: ${text}`)
      }
    } catch (e) {
      console.error("Fetch error:", e)
      setError(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Response Debugger</CardTitle>
        <CardDescription>Test API endpoints and view raw responses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/aircraft-types"
              />
            </div>
            <Button onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Fetch Data"}
            </Button>
          </div>

          {error && <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">{error}</div>}

          {response && (
            <div className="space-y-2">
              <Label>Response</Label>
              <div className="p-4 border bg-gray-50 rounded-md overflow-auto max-h-[400px]">
                <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
              </div>

              <div className="space-y-2">
                <Label>Response Type</Label>
                <div className="p-2 border bg-gray-50 rounded-md">
                  {typeof response === "object"
                    ? Array.isArray(response)
                      ? `Array with ${response.length} items`
                      : `Object with keys: ${Object.keys(response).join(", ")}`
                    : typeof response}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
