# Tool Management API Responses

## Tool Requests

### POST /api/tools/requests
**Request Body:**
\`\`\`json
{
  "toolId": "string",
  "purpose": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "requestedDays": number,
  "notes": "string (optional)",
  "aircraftType": "string (optional)",
  "workOrder": "string (optional)"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "id": "string",
  "requestNumber": "string",
  "requestedById": "string",
  "toolId": "string",
  "purpose": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "requestedDays": number,
  "status": "PENDING",
  "requestedDate": "ISO string",
  "notes": "string",
  "aircraftType": "string",
  "workOrder": "string",
  "tool": {
    "id": "string",
    "name": "string",
    "partNumber": "string",
    "serialNumber": "string"
  },
  "requestedBy": {
    "id": "string",
    "name": "string",
    "department": "string"
  }
}
\`\`\`

### GET /api/tools/requests
**Expected Response:**
\`\`\`json
[
  {
    "id": "string",
    "requestNumber": "string",
    "requestedById": "string",
    "toolId": "string",
    "purpose": "string",
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    "requestedDays": number,
    "status": "PENDING" | "APPROVED" | "REJECTED",
    "requestedDate": "ISO string",
    "approvedDate": "ISO string (optional)",
    "rejectedDate": "ISO string (optional)",
    "notes": "string",
    "rejectionReason": "string (optional)",
    "tool": {
      "id": "string",
      "name": "string",
      "partNumber": "string",
      "serialNumber": "string",
      "status": "AVAILABLE" | "CHECKED_OUT" | "MAINTENANCE" | "RETIRED"
    },
    "requestedBy": {
      "id": "string",
      "name": "string",
      "department": "string",
      "employeeId": "string"
    },
    "approvedBy": {
      "id": "string",
      "name": "string"
    }
  }
]
\`\`\`

### POST /api/tools/requests/:id/approve
**Request Body:**
\`\`\`json
{
  "notes": "string (optional)"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "message": "Tool request approved and checkout created",
  "request": {
    "id": "string",
    "status": "APPROVED",
    "approvedDate": "ISO string",
    "approvedById": "string"
  },
  "checkout": {
    "id": "string",
    "checkoutNumber": "string",
    "toolId": "string",
    "userId": "string",
    "checkoutDate": "ISO string",
    "expectedReturnDate": "ISO string",
    "status": "CHECKED_OUT"
  }
}
\`\`\`

### POST /api/tools/requests/:id/reject
**Request Body:**
\`\`\`json
{
  "reason": "string"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "message": "Tool request rejected",
  "request": {
    "id": "string",
    "status": "REJECTED",
    "rejectedDate": "ISO string",
    "rejectionReason": "string"
  }
}
\`\`\`

## Tool Checkouts

### GET /api/tools/checkouts
**Expected Response:**
\`\`\`json
[
  {
    "id": "string",
    "checkoutNumber": "string",
    "toolId": "string",
    "userId": "string",
    "purpose": "string",
    "checkoutDate": "ISO string",
    "expectedReturnDate": "ISO string",
    "actualReturnDate": "ISO string (optional)",
    "status": "CHECKED_OUT" | "OVERDUE" | "RETURNED" | "LOST" | "DAMAGED",
    "condition": "string (optional)",
    "notes": "string",
    "returnNotes": "string (optional)",
    "tool": {
      "id": "string",
      "name": "string",
      "partNumber": "string",
      "serialNumber": "string"
    },
    "user": {
      "id": "string",
      "name": "string",
      "department": "string",
      "employeeId": "string"
    }
  }
]
\`\`\`

### GET /api/tools/checkouts/my
**Expected Response:** Same as above but filtered for current user

### GET /api/tools/checkouts/overdue
**Expected Response:** Same as above but filtered for overdue checkouts

## Tool Check-in Requests

### POST /api/tools/checkin-requests
**Request Body:**
\`\`\`json
{
  "checkoutId": "string",
  "condition": "GOOD" | "FAIR" | "DAMAGED" | "LOST",
  "notes": "string (optional)"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "message": "Tool check-in request submitted successfully",
  "request": {
    "id": "string",
    "checkoutId": "string",
    "requestedById": "string",
    "condition": "GOOD" | "FAIR" | "DAMAGED" | "LOST",
    "notes": "string",
    "status": "PENDING",
    "requestedDate": "ISO string"
  }
}
\`\`\`

### GET /api/tools/checkin-requests
**Expected Response:**
\`\`\`json
[
  {
    "id": "string",
    "checkoutId": "string",
    "requestedById": "string",
    "condition": "GOOD" | "FAIR" | "DAMAGED" | "LOST",
    "notes": "string",
    "status": "PENDING" | "APPROVED" | "REJECTED",
    "requestedDate": "ISO string",
    "approvedDate": "ISO string (optional)",
    "rejectedDate": "ISO string (optional)",
    "rejectionReason": "string (optional)",
    "checkout": {
      "id": "string",
      "checkoutNumber": "string",
      "tool": {
        "name": "string",
        "partNumber": "string",
        "serialNumber": "string"
      }
    },
    "requestedBy": {
      "id": "string",
      "name": "string",
      "department": "string"
    }
  }
]
\`\`\`

### POST /api/tools/checkin-requests/:id/approve
**Request Body:**
\`\`\`json
{
  "notes": "string (optional)"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "message": "Tool return approved successfully",
  "request": {
    "id": "string",
    "status": "APPROVED",
    "approvedDate": "ISO string"
  }
}
\`\`\`

### POST /api/tools/checkin-requests/:id/reject
**Request Body:**
\`\`\`json
{
  "reason": "string"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "success": true,
  "message": "Tool return rejected",
  "request": {
    "id": "string",
    "status": "REJECTED",
    "rejectedDate": "ISO string",
    "rejectionReason": "string"
  }
}
