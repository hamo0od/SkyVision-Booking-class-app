import type {
  User,
  Material,
  Tool,
  Category,
  Location,
  AircraftType,
  MaterialRequest,
  ToolRequest,
  Checkout,
  ToolCheckinRequest,
} from "./types"

// IMPORTANT: This should point directly to your Express backend, NOT Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  // Add auth token if available AND not a login/register route
  const isAuthRoute = endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/register")
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null

  if (token && !isAuthRoute) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
    console.log(`🔗 Direct API call to Express backend: ${url}`)
  } else {
    console.log(`🔗 Direct API call to Express backend (no auth): ${url}`)
  }

  try {
    console.log(`📡 Making DIRECT request to Express backend: ${url}`)
    console.log(`📡 Request config:`, { method: config.method || "GET", headers: config.headers })

    const response = await fetch(url, config)

    console.log(`📡 Express backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Express backend error ${response.status}:`, errorText)
      throw new ApiError(response.status, `HTTP error! status: ${response.status} - ${errorText}`)
    }

    const text = await response.text()
    if (!text) {
      console.log("📡 Empty response from Express backend")
      return {} as T
    }

    try {
      const data = JSON.parse(text)
      console.log(`✅ Express backend response data:`, data)
      return data
    } catch (e) {
      console.error("❌ Error parsing JSON from Express backend:", e)
      console.log("Raw response from Express backend:", text)
      throw new Error("Invalid JSON response from Express backend")
    }
  } catch (error) {
    console.error(`❌ Express backend API error for ${endpoint}:`, error)
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error(
      `Network error connecting to Express backend: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Helper function to extract data from backend response format
function extractData<T>(response: any): T {
  // If response has success and data properties, extract the data
  if (response && typeof response === "object" && response.success && response.data) {
    console.log("📦 Extracting data from Express backend success response:", response.data)
    return response.data
  }
  // If response is already an array or direct data, return as is
  if (Array.isArray(response) || (response && typeof response === "object")) {
    console.log("📦 Using Express backend response directly:", response)
    return response
  }
  // Fallback
  console.log("📦 Fallback: returning Express backend response as is:", response)
  return response
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiRequest<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    me: () => apiRequest<User>("/auth/me"),

    logout: () => apiRequest("/auth/logout", { method: "POST" }),

    updateProfile: (data: { name: string; email: string; department?: string }) =>
      apiRequest<User>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Users
  users: {
    getAll: async () => {
      const response = await apiRequest<any>("/users")
      return extractData<User[]>(response)
    },
    getById: (id: string) => apiRequest<User>(`/users/${id}`),
    create: (user: Partial<User>) =>
      apiRequest<User>("/users", {
        method: "POST",
        body: JSON.stringify(user),
      }),
    update: (id: string, user: Partial<User>) =>
      apiRequest<User>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(user),
      }),
    delete: (id: string) => apiRequest(`/users/${id}`, { method: "DELETE" }),
  },

  // Materials
  materials: {
    getAll: async () => {
      const response = await apiRequest<any>("/materials")
      return extractData<Material[]>(response)
    },
    getById: (id: string) => apiRequest<Material>(`/materials/${id}`),
    create: (material: Partial<Material>) =>
      apiRequest<Material>("/materials", {
        method: "POST",
        body: JSON.stringify(material),
      }),
    update: (id: string, material: Partial<Material>) =>
      apiRequest<Material>(`/materials/${id}`, {
        method: "PUT",
        body: JSON.stringify(material),
      }),
    delete: (id: string) => apiRequest(`/materials/${id}`, { method: "DELETE" }),
  },

  // Tools
  tools: {
    getAll: async () => {
      const response = await apiRequest<any>("/tools")
      return extractData<Tool[]>(response)
    },
    getById: (id: string) => apiRequest<Tool>(`/tools/${id}`),
    create: (tool: Partial<Tool>) =>
      apiRequest<Tool>("/tools", {
        method: "POST",
        body: JSON.stringify(tool),
      }),
    update: (id: string, tool: Partial<Tool>) =>
      apiRequest<Tool>(`/tools/${id}`, {
        method: "PUT",
        body: JSON.stringify(tool),
      }),
    delete: (id: string) => apiRequest(`/tools/${id}`, { method: "DELETE" }),
  },

  // Tool Requests (for requesting tool checkout)
  toolRequests: {
    getAll: async () => {
      console.log("🔧 Fetching ALL tool requests from Express backend (ADMIN/STOREKEEPER only)")
      const response = await apiRequest<any>("/tools/requests")
      return extractData<ToolRequest[]>(response)
    },
    getByUser: async (userId: string) => {
      // ✅ CRITICAL: Ensure userId is properly encoded and sent as query parameter
      console.log(`🔍 Fetching tool requests for user: "${userId}" from Express backend (TECHNICIAN mode)`)
      console.log(`🔍 User ID type: ${typeof userId}, length: ${userId.length}`)

      if (!userId || userId.trim() === "") {
        throw new Error("User ID is required and cannot be empty")
      }

      try {
        // ✅ PROPERLY encode the userId in the query string
        const encodedUserId = encodeURIComponent(userId.trim())
        const url = `/tools/requests?userId=${encodedUserId}`

        console.log(`🔗 Express backend URL: ${API_BASE_URL}${url}`)
        console.log(`🔗 Query parameter: userId="${encodedUserId}"`)

        const response = await apiRequest<any>(url)
        console.log("📦 Raw user tool requests from Express backend:", response)
        const data = extractData<ToolRequest[]>(response)
        console.log(`✅ Extracted ${data.length} tool requests for user ${userId} from Express backend:`, data)
        return data
      } catch (error) {
        console.error(`❌ Error fetching tool requests for user ${userId} from Express backend:`, error)
        throw error
      }
    },
    getById: (id: string) => apiRequest<ToolRequest>(`/tools/requests/${id}`),
    create: (request: {
      toolId: string
      purpose: string
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      requestedDays: number
      notes?: string
      aircraftType?: string
      workOrder?: string
    }) => {
      console.log("🔧 Creating tool request via Express backend with data:", request)

      // Validate priority
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
      if (!validPriorities.includes(request.priority)) {
        throw new Error(`Invalid priority: ${request.priority}. Must be one of: ${validPriorities.join(", ")}`)
      }

      return apiRequest<ToolRequest>("/tools/requests", {
        method: "POST",
        body: JSON.stringify(request),
      })
    },
    approve: (id: string, data: { notes?: string }) =>
      apiRequest<ToolRequest>(`/tools/requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reject: (id: string, data: { reason: string }) =>
      apiRequest<ToolRequest>(`/tools/requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Tool Checkouts (active tool loans)
  checkouts: {
    getAll: async () => {
      const response = await apiRequest<any>("/tools/checkouts")
      return extractData<Checkout[]>(response)
    },
    getById: (id: string) => apiRequest<Checkout>(`/tools/checkouts/${id}`),
    getMyCheckouts: async () => {
      const response = await apiRequest<any>("/tools/checkouts/my")
      return extractData<Checkout[]>(response)
    },
    getOverdue: async () => {
      const response = await apiRequest<any>("/tools/checkouts/overdue")
      return extractData<Checkout[]>(response)
    },
  },

  // Tool Check-in Requests (when user wants to return a tool)
  toolCheckinRequests: {
    getAll: async () => {
      const response = await apiRequest<any>("/tools/checkin-requests")
      return extractData<ToolCheckinRequest[]>(response)
    },
    getById: (id: string) => apiRequest<ToolCheckinRequest>(`/tools/checkin-requests/${id}`),
    create: (request: {
      checkoutId: string
      condition: "GOOD" | "FAIR" | "DAMAGED" | "LOST"
      notes?: string
    }) =>
      apiRequest<ToolCheckinRequest>("/tools/checkin-requests", {
        method: "POST",
        body: JSON.stringify(request),
      }),
    approve: (id: string, data: { notes?: string }) =>
      apiRequest<ToolCheckinRequest>(`/tools/checkin-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reject: (id: string, data: { reason: string }) =>
      apiRequest<ToolCheckinRequest>(`/tools/checkin-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Categories
  categories: {
    getAll: async () => {
      const response = await apiRequest<any>("/categories")
      return extractData<Category[]>(response)
    },
    create: (category: Partial<Category>) =>
      apiRequest<Category>("/categories", {
        method: "POST",
        body: JSON.stringify(category),
      }),
  },

  // Locations
  locations: {
    getAll: async () => {
      const response = await apiRequest<any>("/locations")
      return extractData<Location[]>(response)
    },
    create: (location: Partial<Location>) =>
      apiRequest<Location>("/locations", {
        method: "POST",
        body: JSON.stringify(location),
      }),
  },

  // Aircraft Types
  aircraftTypes: {
    getAll: async () => {
      console.log("✈️ Fetching aircraft types from Express backend...")
      try {
        const response = await apiRequest<any>("/aircraft-types")
        console.log("📦 Raw aircraft types from Express backend:", response)
        return extractData<AircraftType[]>(response)
      } catch (error) {
        console.error("❌ Error fetching aircraft types from Express backend:", error)
        throw error
      }
    },
    create: (aircraftType: Partial<AircraftType>) =>
      apiRequest<AircraftType>("/aircraft-types", {
        method: "POST",
        body: JSON.stringify(aircraftType),
      }),
  },

  // Material Requests (for consumable materials) - ROLE-AWARE CALLS
  materialRequests: {
    getAll: async () => {
      console.log("📋 Fetching ALL material requests from Express backend (ADMIN/STOREKEEPER only)")
      const response = await apiRequest<any>("/requests")
      console.log("📦 Raw material requests from Express backend:", response)
      return extractData<MaterialRequest[]>(response)
    },
    getByUser: async (userId: string) => {
      // ✅ CRITICAL: Ensure userId is properly encoded and sent as query parameter
      console.log(`🔍 Fetching material requests for user: "${userId}" from Express backend (TECHNICIAN mode)`)
      console.log(`🔍 User ID type: ${typeof userId}, length: ${userId.length}`)

      if (!userId || userId.trim() === "") {
        throw new Error("User ID is required and cannot be empty")
      }

      try {
        // ✅ PROPERLY encode the userId in the query string
        const encodedUserId = encodeURIComponent(userId.trim())
        const url = `/requests?userId=${encodedUserId}`

        console.log(`🔗 Express backend URL: ${API_BASE_URL}${url}`)
        console.log(`🔗 Query parameter: userId="${encodedUserId}"`)
        console.log(`🔗 Expected server comparison: req.query.userId === req.user.userId`)
        console.log(`🔗 Client sending: "${encodedUserId}"`)

        const response = await apiRequest<any>(url)
        console.log("📦 Raw user material requests from Express backend:", response)
        const data = extractData<MaterialRequest[]>(response)
        console.log(`✅ Extracted ${data.length} material requests for user ${userId} from Express backend:`, data)
        return data
      } catch (error) {
        console.error(`❌ Error fetching material requests for user ${userId} from Express backend:`, error)
        throw error
      }
    },
    getById: (id: string) => apiRequest<MaterialRequest>(`/requests/${id}`),
    create: (request: Partial<MaterialRequest>) => {
      console.log("📋 Creating material request via Express backend with data:", request)
      return apiRequest<MaterialRequest>("/requests", {
        method: "POST",
        body: JSON.stringify(request),
      })
    },
    approve: (id: string, data: { notes?: string }) =>
      apiRequest<MaterialRequest>(`/requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reject: (id: string, data: { reason: string }) =>
      apiRequest<MaterialRequest>(`/requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    issue: (id: string, data: { quantityIssued: number; notes?: string }) =>
      apiRequest<MaterialRequest>(`/requests/${id}/issue`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Dashboard stats
  dashboard: {
    getStats: async () => {
      const response = await apiRequest<any>("/dashboard/stats")
      return extractData<{
        totalMaterials: number
        totalTools: number
        totalRequests: number
        totalUsers: number
        lowStockMaterials: number
        pendingRequests: number
        checkedOutTools: number
        overdueTools: number
        recentActivity: Array<{
          id: string
          type: string
          description: string
          timestamp: string
          user?: string
        }>
      }>(response)
    },
  },
}

export { ApiError }
export type {
  User,
  Material,
  Tool,
  Category,
  Location,
  AircraftType,
  MaterialRequest,
  ToolRequest,
  Checkout,
  ToolCheckinRequest,
}
