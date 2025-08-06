"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Package, AlertTriangle, Edit, Trash2, MoreVertical } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import MainLayout from "@/components/layout/main-layout"
import { LoadingSpinner } from "@/components/ui/loading"
import { api, type Material, type Category, type Location } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

// Import the adapter
import { adaptMaterial } from "@/lib/data-adapters"

export default function MaterialsPage() {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()

    // Fallback timer in case the API call hangs
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError("Request timed out. Please check your network connection and try again.")
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timer)
  }, [])

  // In the fetchData function, use the adapter
  const fetchData = async () => {
    try {
      setError(null)
      console.log("Fetching materials data...")

      const [materialsData, categoriesData, locationsData] = await Promise.all([
        api.materials.getAll(),
        api.categories.getAll(),
        api.locations.getAll(),
      ])

      console.log("Raw materials data:", materialsData)

      // Adapt the data to ensure it matches the expected format
      const adaptedMaterials = Array.isArray(materialsData) ? materialsData.map(adaptMaterial) : []

      console.log("Adapted materials data:", adaptedMaterials)

      setMaterials(adaptedMaterials)
      setCategories(categoriesData) // Show all categories
      setLocations(locationsData) // Show all locations
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load materials data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || material.categoryId === selectedCategory
    const matchesLocation = selectedLocation === "all" || material.locationId === selectedLocation
    return matchesSearch && matchesCategory && matchesLocation
  })

  const lowStockMaterials = materials.filter((material) => material.stockQty <= material.minimumLevel)

  // Get material status badge
  const getMaterialStatus = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Active", variant: "default" as const }
      case "INACTIVE":
        return { label: "Inactive", variant: "secondary" as const }
      case "EXPIRED":
        return { label: "Expired", variant: "destructive" as const }
      default:
        return { label: "Unknown", variant: "outline" as const }
    }
  }

  // Get stock level status
  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (current <= minimum) return { label: "Low Stock", variant: "secondary" as const }
    if (current <= minimum * 1.5) return { label: "Warning", variant: "outline" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const handleCreateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const materialData = {
      partNumber: formData.get("partNumber") as string,
      serialNumber: (formData.get("serialNumber") as string) || undefined,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      categoryId: formData.get("categoryId") as string,
      locationId: formData.get("locationId") as string,
      stockQty: Number.parseInt(formData.get("stockQty") as string) || 0,
      unit: formData.get("unit") as string,
      minimumLevel: Number.parseInt(formData.get("minimumLevel") as string) || 0,
      status: "ACTIVE" as const,
    }

    try {
      await api.materials.create(materialData)
      await fetchData() // Refresh the data
      setIsAddDialogOpen(false)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error("Error creating material:", error)
      setError("Failed to create material. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMaterial) return

    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const materialData = {
      partNumber: formData.get("partNumber") as string,
      serialNumber: (formData.get("serialNumber") as string) || undefined,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      categoryId: formData.get("categoryId") as string,
      locationId: formData.get("locationId") as string,
      stockQty: Number.parseInt(formData.get("stockQty") as string) || 0,
      unit: formData.get("unit") as string,
      minimumLevel: Number.parseInt(formData.get("minimumLevel") as string) || 0,
      status: formData.get("status") as "ACTIVE" | "INACTIVE" | "EXPIRED",
    }

    try {
      await api.materials.update(editingMaterial.id, materialData)
      await fetchData() // Refresh the data
      setIsEditDialogOpen(false)
      setEditingMaterial(null)
    } catch (error) {
      console.error("Error updating material:", error)
      setError("Failed to update material. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return

    try {
      await api.materials.delete(id)
      await fetchData() // Refresh the data
    } catch (error) {
      console.error("Error deleting material:", error)
      setError("Failed to delete material. Please try again.")
    }
  }

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material)
    setIsEditDialogOpen(true)
  }

  // Mobile Material Card Component
  const MaterialCard = ({ material }: { material: Material }) => {
    const materialStatus = getMaterialStatus(material.status)
    const stockStatus = getStockStatus(material.stockQty, material.minimumLevel)

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{material.name}</h3>
              <p className="text-xs text-muted-foreground">{material.partNumber}</p>
              {material.serialNumber && <p className="text-xs text-muted-foreground">SN: {material.serialNumber}</p>}
            </div>
            {(user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(material)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteMaterial(material.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Category:</span>
              <span className="text-xs">{material.category?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Location:</span>
              <span className="text-xs">{material.location?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Stock:</span>
              <div className="flex items-center space-x-1">
                <span
                  className={`text-xs ${material.stockQty <= material.minimumLevel ? "text-orange-600 font-medium" : ""}`}
                >
                  {material.stockQty}
                </span>
                <span className="text-xs text-muted-foreground">/ {material.minimumLevel}</span>
                {material.stockQty <= material.minimumLevel && <AlertTriangle className="h-3 w-3 text-orange-500" />}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Unit:</span>
              <span className="text-xs">{material.unit}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <Badge variant={materialStatus.variant} className="text-xs">
              {materialStatus.label}
            </Badge>
            <Badge variant={stockStatus.variant} className="text-xs">
              {stockStatus.label}
            </Badge>
          </div>

          {material.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{material.description}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Materials Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your aircraft maintenance materials and inventory
            </p>
          </div>
          {(user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Add New Material</DialogTitle>
                  <DialogDescription>Add a new material to your inventory system.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <form onSubmit={handleCreateMaterial}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <Label htmlFor="name">Material Name</Label>
                        <Input id="name" name="name" placeholder="Enter material name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Enter material description" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stockQty">Stock Quantity</Label>
                          <Input id="stockQty" name="stockQty" type="number" placeholder="0" min="0" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Select name="unit" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EACH">Each</SelectItem>
                              <SelectItem value="KIT">Kit</SelectItem>
                              <SelectItem value="GALLON">Gallon</SelectItem>
                              <SelectItem value="LITER">Liter</SelectItem>
                              <SelectItem value="POUND">Pound</SelectItem>
                              <SelectItem value="KILOGRAM">Kilogram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minimumLevel">Minimum Level</Label>
                          <Input id="minimumLevel" name="minimumLevel" type="number" placeholder="0" min="0" required />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? "Adding..." : "Add Material"}
                      </Button>
                    </div>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Material Dialog */}
        {editingMaterial && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Material</DialogTitle>
                <DialogDescription>Update the material information.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <form onSubmit={handleEditMaterial}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-partNumber">Part Number</Label>
                        <Input
                          id="edit-partNumber"
                          name="partNumber"
                          defaultValue={editingMaterial.partNumber}
                          placeholder="Enter part number"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-serialNumber">Serial Number</Label>
                        <Input
                          id="edit-serialNumber"
                          name="serialNumber"
                          defaultValue={editingMaterial.serialNumber || ""}
                          placeholder="Enter serial number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Material Name</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        defaultValue={editingMaterial.name}
                        placeholder="Enter material name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        name="description"
                        defaultValue={editingMaterial.description || ""}
                        placeholder="Enter material description"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-categoryId">Category</Label>
                        <Select name="categoryId" defaultValue={editingMaterial.categoryId} required>
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
                        <Label htmlFor="edit-locationId">Location</Label>
                        <Select name="locationId" defaultValue={editingMaterial.locationId} required>
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
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-stockQty">Stock Quantity</Label>
                        <Input
                          id="edit-stockQty"
                          name="stockQty"
                          type="number"
                          defaultValue={editingMaterial.stockQty}
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-unit">Unit</Label>
                        <Select name="unit" defaultValue={editingMaterial.unit} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EACH">Each</SelectItem>
                            <SelectItem value="KIT">Kit</SelectItem>
                            <SelectItem value="GALLON">Gallon</SelectItem>
                            <SelectItem value="LITER">Liter</SelectItem>
                            <SelectItem value="POUND">Pound</SelectItem>
                            <SelectItem value="KILOGRAM">Kilogram</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-minimumLevel">Minimum Level</Label>
                        <Input
                          id="edit-minimumLevel"
                          name="minimumLevel"
                          type="number"
                          defaultValue={editingMaterial.minimumLevel}
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select name="status" defaultValue={editingMaterial.status} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        setEditingMaterial(null)
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? "Updating..." : "Update Material"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground">Active materials in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-orange-500">{lowStockMaterials.length}</div>
              <p className="text-xs text-muted-foreground">Below minimum threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Material categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Locations</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{locations.length}</div>
              <p className="text-xs text-muted-foreground">Storage locations</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-4">
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
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Table/Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Materials Inventory</CardTitle>
            <CardDescription>
              Showing {filteredMaterials.length} of {materials.length} materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Material Status</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const materialStatus = getMaterialStatus(material.status)
                    const stockStatus = getStockStatus(material.stockQty, material.minimumLevel)
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.partNumber}
                          {material.serialNumber && (
                            <div className="text-xs text-muted-foreground">SN: {material.serialNumber}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{material.name}</div>
                            {material.description && (
                              <div className="text-sm text-muted-foreground">{material.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{material.category?.name || "N/A"}</TableCell>
                        <TableCell>{material.location?.name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span
                              className={
                                material.stockQty <= material.minimumLevel ? "text-orange-600 font-medium" : ""
                              }
                            >
                              {material.stockQty}
                            </span>
                            <span className="text-muted-foreground">/ {material.minimumLevel}</span>
                            {material.stockQty <= material.minimumLevel && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>
                          <Badge variant={materialStatus.variant}>{materialStatus.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {(user?.role === "ADMIN" || user?.role === "STOREKEEPER") && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(material)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteMaterial(material.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="grid gap-3 sm:gap-4">
                {filteredMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
