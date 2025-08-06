"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Wrench, AlertTriangle, User, XCircle, Eye, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import MainLayout from "@/components/layout/main-layout"
import { LoadingSpinner } from "@/components/ui/loading"
import { api, type Tool, type Category, type Location, type Checkout, type ToolCheckinRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function ToolsPage() {
  const { user } = useAuth()
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [checkinRequests, setCheckinRequests] = useState<ToolCheckinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null)
  const [selectedCheckinRequest, setSelectedCheckinRequest] = useState<ToolCheckinRequest | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Fetch tools data
      const toolsData = await api.tools.getAll()
      setTools(Array.isArray(toolsData) ? toolsData : [])

      // Fetch categories data
      try {
        const categoriesData = await api.categories.getAll()
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (err) {
        console.error("Error fetching categories:", err)
        setCategories([])
      }

      // Fetch locations data
      try {
        const locationsData = await api.locations.getAll()
        setLocations(Array.isArray(locationsData) ? locationsData : [])
      } catch (err) {
        console.error("Error fetching locations:", err)
        setLocations([])
      }

      // Fetch checkouts data
      try {
        const checkoutsData = await api.checkouts.getAll()
        setCheckouts(Array.isArray(checkoutsData) ? checkoutsData : [])
      } catch (err) {
        console.error("Error fetching checkouts:", err)
        setCheckouts([])
      }

      // Fetch checkin requests data
      try {
        const checkinRequestsData = await api.toolCheckinRequests.getAll()
        setCheckinRequests(Array.isArray(checkinRequestsData) ? checkinRequestsData : [])
      } catch (err) {
        console.error("Error fetching checkin requests:", err)
        setCheckinRequests([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load tools data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTools = Array.isArray(tools)
    ? tools.filter((tool) => {
        const matchesSearch =
          tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tool.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "all" || tool.categoryId === selectedCategory
        const matchesStatus = selectedStatus === "all" || tool.status === selectedStatus
        return matchesSearch && matchesCategory && matchesStatus
      })
    : []

  const availableTools = Array.isArray(tools) ? tools.filter((tool) => tool.status === "AVAILABLE") : []
  const checkedOutTools = Array.isArray(tools) ? tools.filter((tool) => tool.status === "CHECKED_OUT") : []
  const maintenanceTools = Array.isArray(tools) ? tools.filter((tool) => tool.status === "MAINTENANCE") : []

  // Fix for the checkouts.filter error
  const overdueCheckouts = Array.isArray(checkouts)
    ? checkouts.filter((checkout) => {
        if (checkout.status !== "CHECKED_OUT") return false
        const expectedReturn = new Date(checkout.expectedReturnDate)
        return expectedReturn < new Date()
      })
    : []

  const pendingCheckinRequests = Array.isArray(checkinRequests)
    ? checkinRequests.filter((req) => req.status === "PENDING")
    : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="default">Available</Badge>
      case "CHECKED_OUT":
        return <Badge variant="destructive">Checked Out</Badge>
      case "MAINTENANCE":
        return <Badge variant="outline">Maintenance</Badge>
      case "RETIRED":
        return <Badge variant="secondary">Retired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>
      case "APPROVED":
        return <Badge variant="default">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCheckoutStatusBadge = (status: string) => {
    switch (status) {
      case "CHECKED_OUT":
        return <Badge variant="default">Checked Out</Badge>
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>
      case "RETURNED":
        return <Badge variant="secondary">Returned</Badge>
      case "LOST":
        return <Badge variant="destructive">Lost</Badge>
      case "DAMAGED":
        return <Badge variant="destructive">Damaged</Badge>
      case "PENDING_RETURN":
        return <Badge variant="outline">Pending Return</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "GOOD":
        return (
          <Badge variant="default" className="bg-green-500">
            Good
          </Badge>
        )
      case "FAIR":
        return <Badge variant="secondary">Fair</Badge>
      case "DAMAGED":
        return <Badge variant="destructive">Damaged</Badge>
      case "LOST":
        return <Badge variant="destructive">Lost</Badge>
      default:
        return <Badge variant="outline">{condition}</Badge>
    }
  }

  const handleRequestCheckin = async (checkout: Checkout) => {
    setSelectedCheckout(checkout)
    setIsCheckinDialogOpen(true)
  }

  const submitCheckinRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCheckout || !user) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const requestData = {
      checkoutId: selectedCheckout.id,
      condition: formData.get("condition") as "GOOD" | "FAIR" | "DAMAGED" | "LOST",
      notes: (formData.get("notes") as string) || undefined,
    }

    try {
      await api.toolCheckinRequests.create(requestData)
      await fetchData()
      setIsCheckinDialogOpen(false)
      setSelectedCheckout(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error("Error creating check-in request:", error)
      setError("Failed to create check-in request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewCheckinRequest = (request: ToolCheckinRequest) => {
    setSelectedCheckinRequest(request)
    setIsApprovalDialogOpen(true)
  }

  const handleApproveCheckinRequest = async (id: string, notes?: string) => {
    try {
      setIsSubmitting(true)
      await api.toolCheckinRequests.approve(id, { notes: notes || "Check-in approved" })
      await fetchData()
      setIsApprovalDialogOpen(false)
      setSelectedCheckinRequest(null)
    } catch (error) {
      console.error("Error approving check-in request:", error)
      setError("Failed to approve check-in request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectCheckinRequest = async (id: string, reason: string) => {
    try {
      setIsSubmitting(true)
      await api.toolCheckinRequests.reject(id, { reason })
      await fetchData()
      setIsApprovalDialogOpen(false)
      setSelectedCheckinRequest(null)
    } catch (error) {
      console.error("Error rejecting check-in request:", error)
      setError("Failed to reject check-in request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tools Management</h2>
            <p className="text-muted-foreground">Manage tool inventory, checkouts, and returns</p>
          </div>
          {(user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Tool</DialogTitle>
                  <DialogDescription>Add a new tool to your inventory system.</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const toolData = {
                      partNumber: formData.get("partNumber") as string,
                      serialNumber: formData.get("serialNumber") as string,
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                      categoryId: formData.get("categoryId") as string,
                      locationId: formData.get("locationId") as string,
                      maxCheckoutDays: Number.parseInt(formData.get("maxCheckoutDays") as string) || 7,
                    }

                    try {
                      await api.tools.create(toolData)
                      const updatedTools = await api.tools.getAll()
                      setTools(Array.isArray(updatedTools) ? updatedTools : [])
                      setIsAddDialogOpen(false)
                    } catch (error) {
                      console.error("Error creating tool:", error)
                    }
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="partNumber">Part Number</Label>
                        <Input id="partNumber" name="partNumber" placeholder="Enter part number" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">Serial Number</Label>
                        <Input id="serialNumber" name="serialNumber" placeholder="Enter serial number" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Tool Name</Label>
                      <Input id="name" name="name" placeholder="Enter tool name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="Enter tool description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category</Label>
                        <Select name="categoryId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locationId">Location</Label>
                        <Select name="locationId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxCheckoutDays">Max Checkout Days</Label>
                      <Input id="maxCheckoutDays" name="maxCheckoutDays" type="number" defaultValue="7" min="1" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Tool</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tools.length}</div>
              <p className="text-xs text-muted-foreground">Tools in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Wrench className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{availableTools.length}</div>
              <p className="text-xs text-muted-foreground">Ready for checkout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              <User className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{checkedOutTools.length}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{pendingCheckinRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="tools" className="space-y-4">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="tools">Tools Inventory</TabsTrigger>
            <TabsTrigger value="checkouts">Active Checkouts</TabsTrigger>
            <TabsTrigger value="checkins">
              Check-in Requests{" "}
              {pendingCheckinRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCheckinRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tools Inventory Tab */}
          <TabsContent value="tools" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tools Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tools Inventory</CardTitle>
                <CardDescription>
                  Showing {filteredTools.length} of {tools.length} tools
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Max Checkout Days</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTools.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No tools found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTools.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell className="font-medium">{tool.partNumber}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{tool.name}</div>
                                {tool.description && (
                                  <div className="text-sm text-muted-foreground">{tool.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{tool.serialNumber || "-"}</TableCell>
                            <TableCell>{tool.category?.name || "-"}</TableCell>
                            <TableCell>{tool.location?.name || "-"}</TableCell>
                            <TableCell>{getStatusBadge(tool.status)}</TableCell>
                            <TableCell>{tool.maxCheckoutDays} days</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {(user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Info Card for Tool Requests */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    To request a tool for checkout, please go to the{" "}
                    <a href="/requests" className="text-primary hover:underline font-medium">
                      Requests page
                    </a>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All material and tool requests are managed from the Requests page
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Checkouts Tab */}
          <TabsContent value="checkouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Tool Checkouts</CardTitle>
                <CardDescription>Tools currently checked out to technicians</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Checkout #</TableHead>
                        <TableHead>Tool</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Checkout Date</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkouts.length === 0 || !Array.isArray(checkouts) ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No active checkouts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        checkouts
                          .filter((c) => c.status === "CHECKED_OUT" || c.status === "OVERDUE")
                          .map((checkout) => {
                            const isOverdue = new Date(checkout.expectedReturnDate) < new Date()
                            const isMyCheckout = checkout.userId === user?.id

                            return (
                              <TableRow key={checkout.id}>
                                <TableCell className="font-medium">{checkout.checkoutNumber}</TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{checkout.tool?.name || "Unknown"}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {checkout.tool?.partNumber || "-"}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{checkout.user?.name || "Unknown"}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{checkout.purpose}</TableCell>
                                <TableCell>{new Date(checkout.checkoutDate).toLocaleDateString()}</TableCell>
                                <TableCell className={isOverdue ? "text-red-600 font-medium" : ""}>
                                  {new Date(checkout.expectedReturnDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{getCheckoutStatusBadge(isOverdue ? "OVERDUE" : checkout.status)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="icon">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {isMyCheckout && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRequestCheckin(checkout)}
                                      >
                                        Request Return
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Check-in Requests Tab */}
          <TabsContent value="checkins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tool Check-in Requests</CardTitle>
                <CardDescription>Requests from technicians to return tools</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request #</TableHead>
                        <TableHead>Tool</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkinRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No check-in requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        checkinRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.requestNumber}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.checkout?.tool?.name || "Unknown"}</div>
                                <div className="text-sm text-muted-foreground">
                                  {request.checkout?.tool?.partNumber || "-"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{request.requestedBy?.name || "Unknown"}</TableCell>
                            <TableCell>{getConditionBadge(request.condition)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{request.notes || "-"}</TableCell>
                            <TableCell>{getRequestStatusBadge(request.status)}</TableCell>
                            <TableCell>{new Date(request.requestedDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewCheckinRequest(request)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {request.status === "PENDING" &&
                                  (user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleApproveCheckinRequest(request.id)}
                                        title="Approve check-in"
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const reason = prompt("Please provide a reason for rejection:")
                                          if (reason) {
                                            handleRejectCheckinRequest(request.id, reason)
                                          }
                                        }}
                                        title="Reject check-in"
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Check-in Request Dialog */}
        <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Tool Check-in</DialogTitle>
              <DialogDescription>
                Request to return {selectedCheckout?.tool?.name} ({selectedCheckout?.tool?.partNumber})
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitCheckinRequest}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Tool Condition</Label>
                  <Select name="condition" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOOD">Good - No issues</SelectItem>
                      <SelectItem value="FAIR">Fair - Minor wear</SelectItem>
                      <SelectItem value="DAMAGED">Damaged - Needs repair</SelectItem>
                      <SelectItem value="LOST">Lost - Cannot return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Describe the tool condition or any issues..." />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCheckinDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Check-in Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Check-in Request Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Check-in Request Details</DialogTitle>
              <DialogDescription>Review and approve/reject the tool check-in request</DialogDescription>
            </DialogHeader>
            {selectedCheckinRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tool</Label>
                    <p className="text-sm">{selectedCheckinRequest.checkout?.tool?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCheckinRequest.checkout?.tool?.partNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Requested By</Label>
                    <p className="text-sm">{selectedCheckinRequest.requestedBy?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Condition</Label>
                    <div className="mt-1">{getConditionBadge(selectedCheckinRequest.condition)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Request Date</Label>
                    <p className="text-sm">{new Date(selectedCheckinRequest.requestedDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedCheckinRequest.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedCheckinRequest.notes}</p>
                  </div>
                )}

                {selectedCheckinRequest.status === "PENDING" &&
                  (user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Please provide a reason for rejection:")
                          if (reason) {
                            handleRejectCheckinRequest(selectedCheckinRequest.id, reason)
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          const notes = prompt("Add approval notes (optional):")
                          handleApproveCheckinRequest(selectedCheckinRequest.id, notes || undefined)
                        }}
                        disabled={isSubmitting}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Processing..." : "Approve"}
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
