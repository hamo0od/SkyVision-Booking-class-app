"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, FileText, Wrench, TrendingUp, Eye } from "lucide-react"
import MainLayout from "@/components/layout/main-layout"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function Dashboard() {
  const { user } = useAuth()

  // Mock data - replace with real data
  const stats = {
    totalMaterials: 1247,
    lowStockItems: 23,
    pendingRequests: 8,
    toolsOutstanding: 15,
    todayIssued: 45,
    todayReturned: 12,
  }

  const recentRequests = [
    {
      id: "REQ001",
      requester: "Mike Johnson",
      material: "Hydraulic Fluid - AeroShell 41",
      quantity: 5,
      status: "pending",
      priority: "high",
      date: "2024-01-15",
    },
    {
      id: "REQ002",
      requester: "Sarah Wilson",
      material: "Torque Wrench - 50-250 Nm",
      quantity: 1,
      status: "issued",
      priority: "medium",
      date: "2024-01-15",
    },
  ]

  const lowStockItems = [
    {
      partNumber: "HYD-001",
      name: "Hydraulic Seal Kit",
      currentStock: 2,
      minimumLevel: 10,
      location: "A-12-B",
    },
    {
      partNumber: "ENG-045",
      name: "Engine Oil Filter",
      currentStock: 5,
      minimumLevel: 15,
      location: "B-08-C",
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back, {user?.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening in your material management system today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">+12 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-orange-500">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tools Outstanding</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.toolsOutstanding}</div>
              <p className="text-xs text-muted-foreground">Not yet returned</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Recent Requests</CardTitle>
              <CardDescription>Latest material requests from technicians</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{request.material}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested by {request.requester} • Qty: {request.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge variant={request.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                        {request.priority}
                      </Badge>
                      <Badge variant={request.status === "pending" ? "outline" : "default"} className="text-xs">
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/requests">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Requests
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Items below minimum threshold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {lowStockItems.map((item) => (
                  <div
                    key={item.partNumber}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50 space-y-2 sm:space-y-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.partNumber} • Location: {item.location}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-orange-600">
                        {item.currentStock} / {item.minimumLevel}
                      </p>
                      <p className="text-xs text-muted-foreground">Current / Min</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/materials">
                  <Package className="h-4 w-4 mr-2" />
                  View All Low Stock Items
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 mr-2" />
              Today's Activity
            </CardTitle>
            <CardDescription>Material movements for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.todayIssued}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Items Issued</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.todayReturned}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Items Returned</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {stats.todayIssued - stats.todayReturned}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Net Movement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
