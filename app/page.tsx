"use client"

import { useState, useEffect } from "react"
import { Package, Users, FileText, Wrench, AlertTriangle, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import MainLayout from "@/components/layout/main-layout"
import { LoadingSpinner } from "@/components/ui/loading"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface DashboardStats {
  totalMaterials: number
  totalTools: number
  totalRequests: number
  totalUsers: number
  lowStockMaterials: number
  pendingRequests: number
  checkedOutTools: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    user?: string
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setError(null)
      const statsData = await api.dashboard.getStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!stats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to load dashboard data.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's what's happening in your material management system.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">Active inventory items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTools}</div>
              <p className="text-xs text-muted-foreground">Available tools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={stats.lowStockMaterials > 0 ? "border-orange-200 bg-orange-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Materials</CardTitle>
              <AlertTriangle
                className={`h-4 w-4 ${stats.lowStockMaterials > 0 ? "text-orange-500" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.lowStockMaterials > 0 ? "text-orange-600" : ""}`}>
                {stats.lowStockMaterials}
              </div>
              <p className="text-xs text-muted-foreground">Below minimum threshold</p>
            </CardContent>
          </Card>

          <Card className={stats.pendingRequests > 0 ? "border-blue-200 bg-blue-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <FileText
                className={`h-4 w-4 ${stats.pendingRequests > 0 ? "text-blue-500" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pendingRequests > 0 ? "text-blue-600" : ""}`}>
                {stats.pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out Tools</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkedOutTools}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      {activity.user && <p className="text-xs text-muted-foreground">by {activity.user}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{activity.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
