# Complete Material Management System API Documentation

## Authentication Endpoints

### POST /api/auth/login
**Description:** Authenticate user and get user data
**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string"
}
\`\`\`
**Response (200):**
\`\`\`json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "admin" | "storekeeper" | "technician",
  "department": "string",
  "employeeId": "string"
}
\`\`\`
**Errors:**
- 401: Invalid credentials
- 500: Internal server error

### GET /api/auth/me
**Description:** Get current user information
**Headers:** `Authorization: Bearer {userId}`
**Response (200):**
\`\`\`json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "admin" | "storekeeper" | "technician",
  "department": "string",
  "employeeId": "string"
}
\`\`\`

---

## User Management Endpoints

### GET /api/users
**Description:** Get all users
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "ADMIN" | "STOREKEEPER" | "TECHNICIAN",
    "department": "string",
    "employeeId": "string",
    "isActive": boolean,
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
]
\`\`\`

### POST /api/users
**Description:** Create new user
**Request Body:**
\`\`\`json
{
  "email": "string",
  "name": "string",
  "password": "string",
  "role": "ADMIN" | "STOREKEEPER" | "TECHNICIAN",
  "department": "string",
  "employeeId": "string"
}
\`\`\`
**Response (201):** User object without password

### GET /api/users/[id]
**Description:** Get user by ID
**Response (200):** User object

### PUT /api/users/[id]
**Description:** Update user
**Request Body:** Partial user object
**Response (200):** Updated user object

### DELETE /api/users/[id]
**Description:** Delete user
**Response (200):**
\`\`\`json
{
  "message": "User deleted successfully"
}
\`\`\`

---

## Material Management Endpoints

### GET /api/materials
**Description:** Get all materials
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "partNumber": "string",
    "serialNumber": "string",
    "name": "string",
    "description": "string",
    "categoryId": "string",
    "locationId": "string",
    "stockQty": number,
    "unit": "string",
    "minimumLevel": number,
    "status": "ACTIVE" | "INACTIVE" | "DISCONTINUED",
    "isConsumable": boolean,
    "isReturnable": boolean,
    "createdAt": "ISO string",
    "updatedAt": "ISO string",
    "category": {
      "id": "string",
      "name": "string",
      "description": "string"
    },
    "location": {
      "id": "string",
      "name": "string",
      "description": "string"
    },
    "createdBy": {
      "name": "string"
    },
    "updatedBy": {
      "name": "string"
    }
  }
]
\`\`\`

### POST /api/materials
**Description:** Create new material
**Request Body:**
\`\`\`json
{
  "partNumber": "string",
  "serialNumber": "string (optional)",
  "name": "string",
  "description": "string",
  "categoryId": "string",
  "locationId": "string",
  "stockQty": number,
  "unit": "string",
  "minimumLevel": number,
  "createdById": "string",
  "aircraftTypeIds": ["string"] (optional),
  "isReturnable": boolean (default: false)
}
\`\`\`
**Response (201):** Created material object

### GET /api/materials/[id]
**Description:** Get material by ID
**Response (200):** Material object with relations

### PUT /api/materials/[id]
**Description:** Update material
**Request Body:** Partial material object
**Response (200):** Updated material object

### DELETE /api/materials/[id]
**Description:** Delete material
**Response (200):**
\`\`\`json
{
  "message": "Material deleted successfully"
}
\`\`\`

---

## Tool Management Endpoints

### GET /api/tools
**Description:** Get all tools
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "partNumber": "string",
    "serialNumber": "string",
    "name": "string",
    "description": "string",
    "categoryId": "string",
    "locationId": "string",
    "status": "AVAILABLE" | "CHECKED_OUT" | "MAINTENANCE" | "RETIRED" | "PENDING_RETURN",
    "condition": "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED",
    "calibrationDue": "ISO string (optional)",
    "lastCalibrated": "ISO string (optional)",
    "createdAt": "ISO string",
    "updatedAt": "ISO string",
    "category": {
      "id": "string",
      "name": "string"
    },
    "location": {
      "id": "string",
      "name": "string"
    }
  }
]
\`\`\`

### POST /api/tools
**Description:** Create new tool
**Request Body:**
\`\`\`json
{
  "partNumber": "string",
  "serialNumber": "string",
  "name": "string",
  "description": "string",
  "categoryId": "string",
  "locationId": "string",
  "condition": "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED",
  "calibrationDue": "ISO string (optional)",
  "createdById": "string"
}
\`\`\`
**Response (201):** Created tool object

### GET /api/tools/[id]
**Description:** Get tool by ID
**Response (200):** Tool object with relations

### PUT /api/tools/[id]
**Description:** Update tool
**Request Body:** Partial tool object
**Response (200):** Updated tool object

### DELETE /api/tools/[id]
**Description:** Delete tool
**Response (200):**
\`\`\`json
{
  "message": "Tool deleted successfully"
}
\`\`\`

---

## Material Request Endpoints

### GET /api/requests
**Description:** Get all material/tool requests
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "requestNumber": "string",
    "requesterId": "string",
    "materialId": "string (optional)",
    "toolId": "string (optional)",
    "quantityRequested": number,
    "quantityIssued": number (optional),
    "purpose": "string",
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    "status": "PENDING" | "APPROVED" | "REJECTED" | "ISSUED",
    "notes": "string",
    "createdAt": "ISO string",
    "approvedDate": "ISO string (optional)",
    "issuedDate": "ISO string (optional)",
    "requester": {
      "name": "string",
      "email": "string"
    },
    "material": {
      "name": "string",
      "partNumber": "string"
    },
    "tool": {
      "name": "string",
      "partNumber": "string",
      "serialNumber": "string"
    },
    "approvedBy": {
      "name": "string"
    },
    "issuedBy": {
      "name": "string"
    }
  }
]
\`\`\`

### POST /api/requests
**Description:** Create new material/tool request
**Request Body:**
\`\`\`json
{
  "requesterId": "string",
  "materialId": "string (optional)",
  "toolId": "string (optional)",
  "quantityRequested": number,
  "purpose": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "notes": "string (optional)",
  "isToolRequest": boolean (default: false)
}
\`\`\`
**Response (201):** Created request object

### POST /api/requests/[id]/approve
**Description:** Approve a request
**Request Body:**
\`\`\`json
{
  "approvedById": "string"
}
\`\`\`
**Response (200):** Updated request object

### POST /api/requests/[id]/reject
**Description:** Reject a request
**Request Body:**
\`\`\`json
{
  "approvedById": "string",
  "notes": "string (optional)"
}
\`\`\`
**Response (200):** Updated request object

### POST /api/requests/[id]/issue
**Description:** Issue approved request
**Request Body:**
\`\`\`json
{
  "issuedById": "string",
  "quantityIssued": number
}
\`\`\`
**Response (200):**
\`\`\`json
{
  "message": "Request issued successfully",
  "request": "Updated request object",
  "stockChange": {
    "materialName": "string",
    "previousStock": number,
    "newStock": number,
    "quantityIssued": number
  }
}
\`\`\`

---

## Checkout Management Endpoints

### GET /api/checkouts
**Description:** Get all checkouts
**Query Parameters:**
- `type`: "material" | "tool" | "all"
- `status`: "CHECKED_OUT" | "OVERDUE" | "RETURNED"

**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "checkoutNumber": "string",
    "materialId": "string (optional)",
    "toolId": "string (optional)",
    "userId": "string",
    "quantity": number,
    "purpose": "string",
    "checkoutDate": "ISO string",
    "expectedReturnDate": "ISO string (optional)",
    "actualReturnDate": "ISO string (optional)",
    "status": "PENDING" | "CHECKED_OUT" | "OVERDUE" | "RETURNED",
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    "notes": "string",
    "returnNotes": "string (optional)",
    "condition": "string (optional)",
    "material": {
      "name": "string",
      "partNumber": "string",
      "unit": "string"
    },
    "tool": {
      "name": "string",
      "partNumber": "string",
      "serialNumber": "string"
    },
    "user": {
      "name": "string",
      "department": "string",
      "employeeId": "string"
    },
    "issuedBy": {
      "name": "string"
    },
    "returnedBy": {
      "name": "string"
    }
  }
]
\`\`\`

### POST /api/checkouts
**Description:** Create new checkout
**Request Body:**
\`\`\`json
{
  "materialId": "string (optional)",
  "toolId": "string (optional)",
  "userId": "string",
  "quantity": number (default: 1),
  "purpose": "string",
  "expectedReturnDays": number (optional),
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "notes": "string (optional)",
  "issuedById": "string"
}
\`\`\`
**Response (201):** Created checkout object

### POST /api/checkouts/[id]/return
**Description:** Return checked out item
**Request Body:**
\`\`\`json
{
  "returnedById": "string",
  "returnNotes": "string (optional)",
  "condition": "Good" | "Fair" | "Damaged" | "Lost"
}
\`\`\`
**Response (200):** Updated checkout object

---

## Tool-Specific Checkout Endpoints

### POST /api/tools/checkout
**Description:** Checkout a tool
**Request Body:**
\`\`\`json
{
  "toolId": "string",
  "userId": "string",
  "purpose": "string",
  "expectedReturnDays": number,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "notes": "string (optional)"
}
\`\`\`
**Response (201):** Checkout object

### GET /api/tools/checkouts
**Description:** Get all tool checkouts
**Response (200):** Array of tool checkout objects

### GET /api/tools/checkouts/my
**Description:** Get current user's tool checkouts
**Response (200):** Array of user's tool checkouts

### GET /api/tools/checkouts/overdue
**Description:** Get overdue tool checkouts
**Response (200):** Array of overdue checkouts

### POST /api/tools/checkout/[id]/return
**Description:** Return a tool
**Request Body:**
\`\`\`json
{
  "condition": "GOOD" | "FAIR" | "DAMAGED" | "LOST",
  "notes": "string (optional)"
}
\`\`\`
**Response (200):** Updated checkout object

---

## Tool Check-in Request Endpoints

### POST /api/tools/[id]/checkin-request
**Description:** Request to check in a tool
**Request Body:**
\`\`\`json
{
  "condition": "GOOD" | "FAIR" | "DAMAGED" | "LOST",
  "notes": "string (optional)"
}
\`\`\`
**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Tool check-in request submitted successfully",
  "checkout": "Updated checkout object"
}
\`\`\`

### GET /api/tools/checkin-requests
**Description:** Get all tool check-in requests
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "checkoutId": "string",
    "requestedById": "string",
    "condition": "GOOD" | "FAIR" | "DAMAGED" | "LOST",
    "notes": "string",
    "status": "PENDING_RETURN" | "RETURNED" | "REJECTED",
    "requestedDate": "ISO string",
    "approvedDate": "ISO string (optional)",
    "checkout": {
      "checkoutNumber": "string",
      "tool": {
        "name": "string",
        "partNumber": "string"
      }
    },
    "user": {
      "name": "string",
      "department": "string"
    }
  }
]
\`\`\`

### POST /api/tools/checkin-requests/[id]/approve
**Description:** Approve tool check-in request
**Request Body:**
\`\`\`json
{
  "notes": "string (optional)"
}
\`\`\`
**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Tool return approved successfully",
  "checkout": "Updated checkout object"
}
\`\`\`

### POST /api/tools/checkin-requests/[id]/reject
**Description:** Reject tool check-in request
**Request Body:**
\`\`\`json
{
  "reason": "string"
}
\`\`\`
**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Tool return rejected",
  "checkout": "Updated checkout object"
}
\`\`\`

---

## Category Management Endpoints

### GET /api/categories
**Description:** Get all categories
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
]
\`\`\`

### POST /api/categories
**Description:** Create new category
**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`
**Response (201):** Created category object

---

## Location Management Endpoints

### GET /api/locations
**Description:** Get all locations
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
]
\`\`\`

### POST /api/locations
**Description:** Create new location
**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`
**Response (201):** Created location object

---

## Aircraft Type Management Endpoints

### GET /api/aircraft-types
**Description:** Get all aircraft types
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
]
\`\`\`

### POST /api/aircraft-types
**Description:** Create new aircraft type
**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`
**Response (201):** Created aircraft type object

---

## Utility Endpoints

### GET /api/health
**Description:** Health check endpoint
**Response (200):**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "ISO string",
  "database": {
    "healthy": true,
    "responseTime": "string",
    "message": "Database connection successful",
    "version": "string",
    "stats": {
      "users": number,
      "materials": number,
      "categories": number,
      "requests": number
    }
  },
  "environment": {
    "nodeEnv": "string",
    "databaseUrl": "string (masked)"
  }
}
\`\`\`

### GET /api/items
**Description:** Get all items (materials + tools combined)
**Response (200):**
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "partNumber": "string",
    "stockQty": number,
    "category": "Category object",
    "location": "Location object",
    "type": "material" | "tool"
  }
]
\`\`\`

### GET /api/debug/users
**Description:** Debug endpoint to check users
**Response (200):**
\`\`\`json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "string"
    }
  ]
}
\`\`\`

---

## Common Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Validation error message"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Unauthorized access"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Insufficient permissions"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error message"
}
\`\`\`

---

## Authentication & Authorization

Most endpoints require authentication. Include the user ID in the Authorization header:
\`\`\`
Authorization: Bearer {userId}
\`\`\`

### Role-based Access:
- **ADMIN**: Full access to all endpoints
- **STOREKEEPER**: Can manage materials, tools, approve requests, handle checkouts
- **TECHNICIAN**: Can create requests, view materials/tools, manage own checkouts

---

## Rate Limiting & Best Practices

1. **Pagination**: Large datasets should implement pagination (not currently implemented)
2. **Filtering**: Use query parameters for filtering results
3. **Caching**: Consider caching frequently accessed data
4. **Error Handling**: Always check response status codes
5. **Validation**: Validate all input data before sending requests

---

## Testing Endpoints

Use the debug console at `/debug` (development only) to test all endpoints interactively with proper error logging and response formatting.
\`\`\`

Now let's create a comprehensive API testing utility:
