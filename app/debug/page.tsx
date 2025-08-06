"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ApiTester } from "@/components/debug/api-tester"
import { ApiResponseDebugger } from "@/components/debug/api-response-debugger"
import { AircraftTypesDebug } from "@/components/debug/aircraft-types-debug"
import { CacheCleaner } from "@/components/debug/cache-cleaner"
import { Bug, Database, Plane, TestTube, Trash2 } from "lucide-react"

export default function DebugPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Debug Tools
          </h1>
          <p className="text-muted-foreground">
            Development and debugging utilities for the Material Management System
          </p>
        </div>
        <Badge variant="destructive">Development Only</Badge>
      </div>

      <Tabs defaultValue="api-tester" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api-tester" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            API Tester
          </TabsTrigger>
          <TabsTrigger value="api-debugger" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            API Debugger
          </TabsTrigger>
          <TabsTrigger value="aircraft-debug" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Aircraft Debug
          </TabsTrigger>
          <TabsTrigger value="cache-cleaner" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Cache Cleaner
          </TabsTrigger>
          <TabsTrigger value="system-info" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-tester">
          <ApiTester />
        </TabsContent>

        <TabsContent value="api-debugger">
          <ApiResponseDebugger />
        </TabsContent>

        <TabsContent value="aircraft-debug">
          <AircraftTypesDebug />
        </TabsContent>

        <TabsContent value="cache-cleaner">
          <div className="flex justify-center">
            <CacheCleaner />
          </div>
        </TabsContent>

        <TabsContent value="system-info">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Environment</h4>
                    <p className="text-sm text-muted-foreground">{process.env.NODE_ENV || "development"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">API Base URL</h4>
                    <p className="text-sm text-muted-foreground">
                      {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">User Agent</h4>
                    <p className="text-sm text-muted-foreground">
                      {typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 50) + "..." : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Local Storage Available</h4>
                    <p className="text-sm text-muted-foreground">
                      {typeof localStorage !== "undefined" ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
