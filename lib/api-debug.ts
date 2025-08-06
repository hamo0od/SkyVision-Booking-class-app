// API Response Types
export interface ToolRequest {
  id: string
  toolId: string
  userId: string
  requestedAt: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  reason?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  tool?: {
    id: string
    name: string
    serialNumber: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface ToolCheckout {
  id: string
  toolId: string
  userId: string
  checkedOutAt: string
  dueDate: string
  returnedAt?: string
  status: "ACTIVE" | "RETURNED" | "OVERDUE"
  tool?: {
    id: string
    name: string
    serialNumber: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface CheckinRequest {
  id: string
  checkoutId: string
  userId: string
  requestedAt: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  reason?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  checkout?: ToolCheckout
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Enhanced API debugging utility
export class ApiDebugger {
  private static logRequest(method: string, url: string, data?: any) {
    console.group(`🚀 API Request: ${method} ${url}`)
    console.log(`📤 Request URL: ${url}`)
    console.log(`📤 Request Method: ${method}`)
    if (data) {
      console.log(`📤 Request Data:`, data)
    }
    console.log(`📤 Timestamp: ${new Date().toISOString()}`)
    console.groupEnd()
  }

  private static logResponse(method: string, url: string, response: Response, data: any, startTime: number) {
    const duration = Date.now() - startTime

    if (response.ok) {
      console.group(`✅ API Response: ${response.status} ${url}`)
      console.log(`📥 Status: ${response.status}`)
      console.log(`📥 Duration: ${duration}ms`)
      console.log(`📥 Response Data:`, data)
      console.log(`📥 Timestamp: ${new Date().toISOString()}`)
      console.groupEnd()
    } else {
      console.group(`❌ API Error: ${response.status} ${url}`)
      console.log(`📥 Status: ${response.status}`)
      console.log(`📥 Duration: ${duration}ms`)
      console.log(`📥 Error Data:`, data)
      console.log(`📥 Timestamp: ${new Date().toISOString()}`)
      console.groupEnd()
    }
  }

  private static logError(method: string, url: string, error: any) {
    console.group(`💥 API Error`)
    console.log(`🔥 URL: ${url}`)
    console.log(`🔥 Method: ${method}`)
    console.log(`🔥 Error:`, error)
    console.log(`🔥 Error Type:`, typeof error)
    console.log(`🔥 Error Message:`, error?.message || "Unknown error")
    if (error?.stack) {
      console.log(`🔥 Stack Trace:`, error.stack)
    }
    console.log(`🔥 Timestamp: ${new Date().toISOString()}`)
    console.groupEnd()
  }

  static async request<T = any>(
    method: string,
    url: string,
    data?: any,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now()

    try {
      this.logRequest(method, url, data)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      })

      const responseData = await response.json()
      this.logResponse(method, url, response, responseData, startTime)

      if (!response.ok) {
        return {
          success: false,
          error: responseData.error || `HTTP ${response.status}: ${response.statusText}`,
          data: responseData,
        }
      }

      return {
        success: true,
        data: responseData,
      }
    } catch (error) {
      this.logError(method, url, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Tool Request API methods
  static async getToolRequests(): Promise<ApiResponse<ToolRequest[]>> {
    return this.request<ToolRequest[]>("GET", "/api/tools/requests")
  }

  static async createToolRequest(data: { toolId: string; reason?: string }): Promise<ApiResponse<ToolRequest>> {
    return this.request<ToolRequest>("POST", "/api/tools/requests", data)
  }

  static async approveToolRequest(id: string): Promise<ApiResponse<ToolRequest>> {
    return this.request<ToolRequest>("POST", `/api/tools/requests/${id}/approve`)
  }

  static async rejectToolRequest(id: string, reason?: string): Promise<ApiResponse<ToolRequest>> {
    return this.request<ToolRequest>("POST", `/api/tools/requests/${id}/reject`, { reason })
  }

  // Tool Checkout API methods
  static async getToolCheckouts(): Promise<ApiResponse<ToolCheckout[]>> {
    return this.request<ToolCheckout[]>("GET", "/api/tools/checkouts")
  }

  static async getMyToolCheckouts(): Promise<ApiResponse<ToolCheckout[]>> {
    return this.request<ToolCheckout[]>("GET", "/api/tools/checkouts/my")
  }

  static async getOverdueCheckouts(): Promise<ApiResponse<ToolCheckout[]>> {
    return this.request<ToolCheckout[]>("GET", "/api/tools/checkouts/overdue")
  }

  // Check-in Request API methods
  static async getCheckinRequests(): Promise<ApiResponse<CheckinRequest[]>> {
    return this.request<CheckinRequest[]>("GET", "/api/tools/checkin-requests")
  }

  static async createCheckinRequest(data: { checkoutId: string; reason?: string }): Promise<
    ApiResponse<CheckinRequest>
  > {
    return this.request<CheckinRequest>("POST", "/api/tools/checkin-requests", data)
  }

  static async approveCheckinRequest(id: string): Promise<ApiResponse<CheckinRequest>> {
    return this.request<CheckinRequest>("POST", `/api/tools/checkin-requests/${id}/approve`)
  }

  static async rejectCheckinRequest(id: string, reason?: string): Promise<ApiResponse<CheckinRequest>> {
    return this.request<CheckinRequest>("POST", `/api/tools/checkin-requests/${id}/reject`, { reason })
  }
}

// Expected response formats documentation
export const API_DOCUMENTATION = {
  "GET /api/tools/requests": {
    description: "Get all tool requests",
    expectedResponse: {
      success: true,
      data: [
        {
          id: "string",
          toolId: "string",
          userId: "string",
          requestedAt: "ISO date string",
          status: "PENDING | APPROVED | REJECTED",
          reason: "string (optional)",
          tool: { id: "string", name: "string", serialNumber: "string" },
          user: { id: "string", name: "string", email: "string" },
        },
      ],
    },
  },
  "POST /api/tools/requests": {
    description: "Create a new tool request",
    requestBody: { toolId: "string", reason: "string (optional)" },
    expectedResponse: {
      success: true,
      data: {
        id: "string",
        toolId: "string",
        userId: "string",
        requestedAt: "ISO date string",
        status: "PENDING",
        reason: "string (optional)",
      },
    },
  },
  "GET /api/tools/checkouts": {
    description: "Get all tool checkouts",
    expectedResponse: {
      success: true,
      data: [
        {
          id: "string",
          toolId: "string",
          userId: "string",
          checkedOutAt: "ISO date string",
          dueDate: "ISO date string",
          returnedAt: "ISO date string (optional)",
          status: "ACTIVE | RETURNED | OVERDUE",
        },
      ],
    },
  },
}
