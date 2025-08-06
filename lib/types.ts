export interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "STOREKEEPER" | "TECHNICIAN"
  department?: string
  createdAt: string
  updatedAt: string
}

export interface Material {
  id: string
  name: string
  partNumber: string
  description?: string
  category: string
  location: string
  stockQty: number
  minStockLevel: number
  unitPrice: number
  supplier?: string
  createdAt: string
  updatedAt: string
}

export interface Tool {
  id: string
  name: string
  partNumber: string
  serialNumber: string
  description?: string
  category: string
  location: string
  status: "AVAILABLE" | "CHECKED_OUT" | "MAINTENANCE" | "RETIRED"
  condition: "NEW" | "GOOD" | "FAIR" | "POOR"
  purchaseDate?: string
  lastMaintenanceDate?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface AircraftType {
  id: string
  name: string
  model?: string
  manufacturer?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialRequest {
  id: string
  requestNumber: string
  requesterId: string
  materialId?: string
  toolId?: string
  quantityRequested: number
  quantityIssued?: number
  purpose: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "PENDING" | "APPROVED" | "REJECTED" | "ISSUED" | "COMPLETED"
  notes?: string
  aircraftType?: string
  workOrder?: string
  requestedDate: string
  approvedDate?: string
  issuedDate?: string
  completedDate?: string
  createdAt: string
  updatedAt: string

  // Relations
  requester?: {
    id: string
    name: string
    email: string
  }
  material?: {
    id: string
    name: string
    partNumber: string
  }
  tool?: {
    id: string
    name: string
    partNumber: string
    serialNumber: string
  }
  approvedBy?: {
    id: string
    name: string
  }
  issuedBy?: {
    id: string
    name: string
  }
}

export interface ToolRequest {
  id: string
  requestNumber: string
  requesterId: string
  toolId: string
  purpose: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "PENDING" | "APPROVED" | "REJECTED"
  requestedDays: number
  notes?: string
  aircraftType?: string
  workOrder?: string
  requestedDate: string
  approvedDate?: string
  rejectedDate?: string
  createdAt: string
  updatedAt: string

  // Relations
  requester?: User
  tool?: Tool
  approvedBy?: User
}

export interface Checkout {
  id: string
  toolId: string
  userId: string
  checkoutDate: string
  expectedReturnDate: string
  actualReturnDate?: string
  purpose: string
  notes?: string
  status: "ACTIVE" | "RETURNED" | "OVERDUE"
  createdAt: string
  updatedAt: string

  // Relations
  tool?: Tool
  user?: User
}

export interface ToolCheckinRequest {
  id: string
  checkoutId: string
  condition: "GOOD" | "FAIR" | "DAMAGED" | "LOST"
  notes?: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  requestedDate: string
  approvedDate?: string
  rejectedDate?: string
  createdAt: string
  updatedAt: string

  // Relations
  checkout?: Checkout
  approvedBy?: User
}
