"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export function AircraftTypesDebug() {
  const [aircraftTypes, setAircraftTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAircraftTypes = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🧪 Testing aircraft types API...")
      const response = await api.aircraftTypes.getAll()
      console.log("✅ Aircraft types response:", response)
      setAircraftTypes(response)
    } catch (err) {
      console.error("❌ Aircraft types error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testDirectFetch = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🧪 Testing direct fetch...")
      const response = await fetch("/api/aircraft-types")
      const data = await response.json()
      console.log("✅ Direct fetch response:", data)
      setAircraftTypes(data)
    } catch (err) {
      console.error("❌ Direct fetch error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aircraft Types Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testAircraftTypes} disabled={loading}>
            Test API Client
          </Button>
          <Button onClick={testDirectFetch} disabled={loading}>
            Test Direct Fetch
          </Button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        <div>
          <h4 className="font-semibold">Aircraft Types ({aircraftTypes.length}):</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(aircraftTypes, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
