"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, Eye, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { api, type MaterialRequest, type ToolRequest, type Material, type Tool, type AircraftType } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

// Create a unified request type that can represent both material and tool requests
type UnifiedRequest = MaterialRequest | ToolRequest

export default function RequestsPage() {
  const { user } = useAuth()
  // Change the type to accommodate both request types
  const [requests, setRequests] = useState<UnifiedRequest[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null)
  const [requestType, setRequestType] = useState<"material" | "tool">("material")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // ✅ CRITICAL: Don't fetch data if user is not loaded yet
    if (!user) {
      console.log("⏳ User not loaded yet, skipping data fetch...")
      return
    }

    console.log("👤 User loaded, proceeding with data fetch:", {
      userId: user.id,
      userRole: user.role,
      userName: user.name,
    })

    fetchData()
  }, [user])

  const fetchData = async () => {
    // ✅ DOUBLE CHECK: Ensure user exists before making any API calls
    if (!user || !user.id) {
      console.error("❌ Cannot fetch data: user or user.id is missing")
      setError("User authentication required")
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      console.log("🔄 Fetching requests data for authenticated user...")

      // ALWAYS fetch ALL materials, tools, and aircraft types (for creating new requests)
      // This allows technicians to see all available items when creating requests
      const [materialsData, toolsData, aircraftTypesData] = await Promise.all([
        api.materials.getAll(),
        api.tools.getAll(),
        api.aircraftTypes.getAll(),
      ])

      console.log("📦 Materials, tools, and aircraft types fetched for all users:", {
        materialsCount: materialsData?.length,
        toolsCount: toolsData?.length,
        aircraftTypesCount: aircraftTypesData?.length,
      })

      // Fetch REQUESTS based on user role - AVOID GLOBAL CALLS FOR TECHNICIANS
      let requestsData: UnifiedRequest[] = []
      if (user.role === "TECHNICIAN") {
        console.log(`🔒 TECHNICIAN MODE: Making ONLY user-specific API calls for user ID: ${user.id}`)
        console.log(`🚫 AVOIDING global /api/requests and /api/tools/requests calls`)

        // ✅ CRITICAL: Verify user.id is properly passed as query parameter
        console.log(`🔍 About to call getByUser with userId: "${user.id}" (type: ${typeof user.id})`)

        // For technicians, fetch ONLY their own material and tool requests
        // NO GLOBAL API CALLS - only user-specific endpoints
        const [materialRequests, toolRequests] = await Promise.all([
          api.materialRequests.getByUser(user.id), // GET /requests?userId=123 (NOT /requests)
          api.toolRequests.getByUser(user.id), // GET /tools/requests?userId=123 (NOT /tools/requests)
        ])

        console.log("🔒 Technician's material requests (user-specific call):", materialRequests)
        console.log("🔒 Technician's tool requests (user-specific call):", toolRequests)

        // Combine the requests
        requestsData = [
          ...(Array.isArray(materialRequests) ? materialRequests : []),
          ...(Array.isArray(toolRequests) ? toolRequests : []),
        ]

        console.log(
          `🔒 TECHNICIAN: Found ${requestsData.length} total requests for user ${user.name} (NO GLOBAL CALLS MADE)`,
        )
      } else {
        console.log("🔓 ADMIN/STOREKEEPER MODE: Making global API calls to fetch ALL requests from all users")

        // For admins/storekeepers, fetch ALL material and tool requests
        // GLOBAL API CALLS are OK for admins/storekeepers
        const [materialRequests, toolRequests] = await Promise.all([
          api.materialRequests.getAll(), // GET /requests (global call)
          api.toolRequests.getAll(), // GET /tools/requests (global call)
        ])

        console.log("🔓 All material requests (global call):", materialRequests)
        console.log("🔓 All tool requests (global call):", toolRequests)

        // Combine the requests
        requestsData = [
          ...(Array.isArray(materialRequests) ? materialRequests : []),
          ...(Array.isArray(toolRequests) ? toolRequests : []),
        ]

        console.log(`🔓 ADMIN/STOREKEEPER: Found ${requestsData.length} total requests from all users`)
      }

      // Remove any duplicate requests (based on ID)
      const uniqueRequests = Array.from(new Map(requestsData.map((item) => [item.id, item])).values())

      console.log(
        `✅ Final result: ${uniqueRequests.length} unique requests (removed ${requestsData.length - uniqueRequests.length} duplicates)`,
      )

      setRequests(uniqueRequests)
      setMaterials(Array.isArray(materialsData) ? materialsData : [])
      setTools(Array.isArray(toolsData) ? toolsData : [])
      setAircraftTypes(Array.isArray(aircraftTypesData) ? aircraftTypesData : [])
    } catch (error) {
      console.error("❌ Error fetching data:", error)
      setError("Failed to load requests data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to determine if a request is a material request
  const isMaterialRequest = (request: UnifiedRequest): request is MaterialRequest => {
    return "materialId" in request && request.materialId !== undefined
  }

  // Helper function to determine if a request is a tool request
  const isToolRequest = (request: UnifiedRequest): request is ToolRequest => {
    return "toolId" in request && request.toolId !== undefined && !("materialId" in request)
  }

  // Helper function to get quantity (handles both request types)
  const getRequestQuantity = (request: UnifiedRequest): number => {
    if (isMaterialRequest(request)) {
      return request.quantityRequested || 0
    } else if (isToolRequest(request)) {
      return request.requestedDays || 0
    }
    return 0
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus
    const matchesPriority = selectedPriority === "all" || request.priority === selectedPriority
    const matchesType =
      selectedType === "all" ||
      (selectedType === "material" && isMaterialRequest(request)) ||
      (selectedType === "tool" && isToolRequest(request))
    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  const pendingRequests = requests.filter((request) => request.status === "PENDING")
  const approvedRequests = requests.filter((request) => request.status === "APPROVED")
  const issuedRequests = requests.filter((request) => request.status === "ISSUED")
  const materialRequests = requests.filter(isMaterialRequest)
  const toolRequests = requests.filter(isToolRequest)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>
      case "APPROVED":
        return <Badge variant="default">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      case "ISSUED":
        return <Badge variant="secondary">Issued</Badge>
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "LOW":
        return <Badge variant="outline">Low</Badge>
      case "MEDIUM":
        return <Badge variant="secondary">Medium</Badge>
      case "HIGH":
        return <Badge variant="destructive">High</Badge>
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getRequestTypeBadge = (request: UnifiedRequest) => {
    if (isMaterialRequest(request)) {
      return <Badge variant="default">Material</Badge>
    } else if (isToolRequest(request)) {
      return <Badge variant="secondary">Tool</Badge>
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const requestData = {
      materialId: requestType === "material" ? (formData.get("itemId") as string) : undefined,
      toolId: requestType === "tool" ? (formData.get("itemId") as string) : undefined,
      quantity: Number.parseInt(formData.get("quantity") as string) || 1,
      priority: formData.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      purpose: formData.get("purpose") as string,
      notes: (formData.get("notes") as string) || undefined,
      aircraftType: (formData.get("aircraftType") as string) || undefined,
      workOrder: (formData.get("workOrder") as string) || undefined,
    }

    try {
      console.log("📝 Creating request with data:", requestData)

      // Use the appropriate API based on request type
      if (requestType === "material") {
        await api.materialRequests.create(requestData)
      } else {
        // For tool requests, we need to use the tool requests API
        await api.toolRequests.create({
          toolId: requestData.toolId!,
          purpose: requestData.purpose,
          priority: requestData.priority,
          requestedDays: requestData.quantity, // For tools, quantity becomes requested days
          notes: requestData.notes,
          aircraftType: requestData.aircraftType,
          workOrder: requestData.workOrder,
        })
      }

      await fetchData() // Refresh the data
      setIsAddDialogOpen(false)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
      setRequestType("material") // Reset to default
    } catch (error) {
      console.error("❌ Error creating request:", error)
      setError("Failed to create request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveRequest = async (id: string) => {
    try {
      await api.materialRequests.approve(id, { notes: "Approved by storekeeper" })
      await fetchData() // Refresh the data
    } catch (error) {
      console.error("❌ Error approving request:", error)
      setError("Failed to approve request. Please try again.")
    }
  }

  const handleRejectRequest = async (id: string) => {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    try {
      await api.materialRequests.reject(id, { reason })
      await fetchData() // Refresh the data
    } catch (error) {
      console.error("❌ Error rejecting request:", error)
      setError("Failed to reject request. Please try again.")
    }
  }

  const handleIssueRequest = async (id: string, quantity: number) => {
    try {
      await api.materialRequests.issue(id, { quantityIssued: quantity, notes: "Issued by storekeeper" })
      await fetchData() // Refresh the data
    } catch (error) {
      console.error("❌ Error issuing request:", error)
      setError("Failed to issue request. Please try again.")
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Determine page title based on user role
  const getPageTitle = () => {
    if (user?.role === "TECHNICIAN") {
      return "My Requests"
    }
    return "Material & Tool Requests"
  }

  const getPageDescription = () => {
    if (user?.role === "TECHNICIAN") {
      return "View and manage your material and tool requests. You can request any available materials or tools."
    }
    return "Manage all material and tool requests from technicians"
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{getPageTitle()}</h2>
            <p className="text-muted-foreground">{getPageDescription()}</p>
            {user?.role === "TECHNICIAN" && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-blue-600">
                  🔒 Privacy Mode: Only your requests are shown. No global API calls are made.
                </p>
                <p className="text-xs text-gray-500">
                  User ID: {user.id} | Role: {user.role} | Name: {user.name}
                </p>
              </div>
            )}
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Request</DialogTitle>
                <DialogDescription>
                  Submit a new material or tool request. You can choose from all available items.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequest}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select value={requestType} onValueChange={(value: "material" | "tool") => setRequestType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material Request</SelectItem>
                        <SelectItem value="tool">Tool Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemId">{requestType === "material" ? "Material" : "Tool"}</Label>
                    <Select name="itemId" required>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Select ${requestType} (${requestType === "material" ? materials.length : tools.length} available)`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {requestType === "material"
                          ? materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.partNumber} - {material.name}
                              </SelectItem>
                            ))
                          : tools.map((tool) => (
                              <SelectItem key={tool.id} value={tool.id}>
                                {tool.partNumber} - {tool.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {requestType === "material"
                        ? `${materials.length} materials available to request`
                        : `${tools.length} tools available to request`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">{requestType === "material" ? "Quantity" : "Days Needed"}</Label>
                      <Input id="quantity" name="quantity" type="number" placeholder="1" min="1" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aircraftType">Aircraft Type</Label>
                      <Select name="aircraftType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select aircraft" />
                        </SelectTrigger>
                        <SelectContent>
                          {aircraftTypes.map((aircraft) => (
                            <SelectItem key={aircraft.id} value={aircraft.name}>
                              {aircraft.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workOrder">Work Order</Label>
                      <Input id="workOrder" name="workOrder" placeholder="WO-2024-XXX" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      placeholder="Describe the purpose of this request..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Any additional information..." />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "TECHNICIAN" ? "Your requests" : "All requests"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Material Requests</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{materialRequests.length}</div>
              <p className="text-xs text-muted-foreground">Material requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tool Requests</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{toolRequests.length}</div>
              <p className="text-xs text-muted-foreground">Tool requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Ready for issue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issued</CardTitle>
              <XCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{issuedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Items issued</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="material">Material Requests</SelectItem>
                  <SelectItem value="tool">Tool Requests</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>{user?.role === "TECHNICIAN" ? "My Requests" : "Material & Tool Requests"}</CardTitle>
            <CardDescription>
              Showing {filteredRequests.length} of {requests.length} requests
              {user?.role === "TECHNICIAN" && " (only your requests - no global calls made)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No requests found</h3>
                <p className="text-sm text-muted-foreground">
                  {requests.length === 0
                    ? user?.role === "TECHNICIAN"
                      ? "You haven't created any requests yet. Click 'New Request' to get started."
                      : "No requests have been created yet."
                    : "Try adjusting your filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Type</TableHead>
                    {user?.role !== "TECHNICIAN" && <TableHead>Requested By</TableHead>}
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity/Days</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.requestNumber}</TableCell>
                      <TableCell>{getRequestTypeBadge(request)}</TableCell>
                      {user?.role !== "TECHNICIAN" && <TableCell>{request.requester?.name || "Unknown"}</TableCell>}
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {isMaterialRequest(request)
                              ? request.material?.name
                              : isToolRequest(request)
                                ? request.tool?.name
                                : "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isMaterialRequest(request)
                              ? request.material?.partNumber
                              : isToolRequest(request)
                                ? request.tool?.partNumber
                                : "Unknown"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isMaterialRequest(request)
                          ? request.quantityRequested
                          : isToolRequest(request)
                            ? `${request.requestedDays} days`
                            : "N/A"}
                      </TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.requestedDate || request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "PENDING" && (user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleApproveRequest(request.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRejectRequest(request.id)}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {request.status === "APPROVED" &&
                            isMaterialRequest(request) &&
                            (user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIssueRequest(request.id, request.quantityRequested)}
                              >
                                Issue
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Request Details Dialog */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Request Details - {selectedRequest.requestNumber}</DialogTitle>
                <DialogDescription>Complete information about this request</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Requester</Label>
                    <p className="text-sm">{selectedRequest.requester?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Request Date</Label>
                    <p className="text-sm">
                      {new Date(selectedRequest.requestedDate || selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Request Type</Label>
                    {getRequestTypeBadge(selectedRequest)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    {getPriorityBadge(selectedRequest.priority)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Item</Label>
                  <p className="text-sm">
                    {isMaterialRequest(selectedRequest)
                      ? selectedRequest.material?.name
                      : isToolRequest(selectedRequest)
                        ? selectedRequest.tool?.name
                        : "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isMaterialRequest(selectedRequest)
                      ? selectedRequest.material?.partNumber
                      : isToolRequest(selectedRequest)
                        ? selectedRequest.tool?.partNumber
                        : "Unknown"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      {isMaterialRequest(selectedRequest) ? "Quantity" : "Days Requested"}
                    </Label>
                    <p className="text-sm">
                      {isMaterialRequest(selectedRequest)
                        ? selectedRequest.quantityRequested
                        : isToolRequest(selectedRequest)
                          ? `${selectedRequest.requestedDays} days`
                          : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Work Order</Label>
                    <p className="text-sm">{selectedRequest.workOrder || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Purpose</Label>
                  <p className="text-sm">{selectedRequest.purpose}</p>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
                {selectedRequest.aircraftType && (
                  <div>
                    <Label className="text-sm font-medium">Aircraft Type</Label>
                    <p className="text-sm">{selectedRequest.aircraftType}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}
