import type { Material, Category, Location, User, Tool, MaterialRequest, Checkout } from "./types"

// Adapter to convert backend response to frontend format
export function adaptMaterial(data: any): Material {
  return {
    id: data.id,
    partNumber: data.partNumber || data.part_number,
    serialNumber: data.serialNumber || data.serial_number,
    name: data.name,
    description: data.description,
    categoryId: data.categoryId || data.category_id,
    locationId: data.locationId || data.location_id,
    stockQty: data.stockQty || data.stock_qty || 0,
    unit: data.unit,
    minimumLevel: data.minimumLevel || data.minimum_level || 0,
    status: data.status || "ACTIVE",
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    category: data.category
      ? {
          id: data.category.id,
          name: data.category.name,
          description: data.category.description,
          type: data.category.type,
          createdAt: data.category.createdAt || data.category.created_at,
          updatedAt: data.category.updatedAt || data.category.updated_at,
        }
      : undefined,
    location: data.location
      ? {
          id: data.location.id,
          name: data.location.name,
          description: data.location.description,
          type: data.location.type,
          createdAt: data.location.createdAt || data.location.created_at,
          updatedAt: data.location.updatedAt || data.location.updated_at,
        }
      : undefined,
  }
}

export function adaptCategory(data: any): Category {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
  }
}

export function adaptLocation(data: any): Location {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
  }
}

export function adaptUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    department: data.department,
    employeeId: data.employeeId || data.employee_id,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
  }
}

export function adaptTool(data: any): Tool {
  return {
    id: data.id,
    partNumber: data.partNumber || data.part_number,
    serialNumber: data.serialNumber || data.serial_number,
    name: data.name,
    description: data.description,
    categoryId: data.categoryId || data.category_id,
    locationId: data.locationId || data.location_id,
    status: data.status || "AVAILABLE",
    maxCheckoutDays: data.maxCheckoutDays || data.max_checkout_days || 30,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    category: data.category ? adaptCategory(data.category) : undefined,
    location: data.location ? adaptLocation(data.location) : undefined,
    currentCheckout: data.currentCheckout ? adaptCheckout(data.currentCheckout) : undefined,
  }
}

export function adaptMaterialRequest(data: any): MaterialRequest {
  return {
    id: data.id,
    requestNumber: data.requestNumber || data.request_number,
    requestedById: data.requestedById || data.requested_by_id,
    materialId: data.materialId || data.material_id,
    toolId: data.toolId || data.tool_id,
    quantity: data.quantity,
    purpose: data.purpose,
    priority: data.priority,
    status: data.status,
    requestedDate: data.requestedDate || data.requested_date,
    approvedDate: data.approvedDate || data.approved_date,
    issuedDate: data.issuedDate || data.issued_date,
    completedDate: data.completedDate || data.completed_date,
    notes: data.notes,
    aircraftType: data.aircraftType || data.aircraft_type,
    workOrder: data.workOrder || data.work_order,
    material: data.material ? adaptMaterial(data.material) : undefined,
    tool: data.tool ? adaptTool(data.tool) : undefined,
    requestedBy: data.requestedBy ? adaptUser(data.requestedBy) : undefined,
    approvedBy: data.approvedBy ? adaptUser(data.approvedBy) : undefined,
    issuedBy: data.issuedBy ? adaptUser(data.issuedBy) : undefined,
  }
}

export function adaptCheckout(data: any): Checkout {
  return {
    id: data.id,
    checkoutNumber: data.checkoutNumber || data.checkout_number,
    toolId: data.toolId || data.tool_id,
    userId: data.userId || data.user_id,
    purpose: data.purpose,
    checkoutDate: data.checkoutDate || data.checkout_date,
    expectedReturnDate: data.expectedReturnDate || data.expected_return_date,
    actualReturnDate: data.actualReturnDate || data.actual_return_date,
    status: data.status,
    condition: data.condition,
    notes: data.notes,
    returnNotes: data.returnNotes || data.return_notes,
    tool: data.tool ? adaptTool(data.tool) : undefined,
    user: data.user ? adaptUser(data.user) : undefined,
  }
}
