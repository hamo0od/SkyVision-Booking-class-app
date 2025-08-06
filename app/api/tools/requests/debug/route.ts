import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("DEBUG: Received tool request data:", body)
    console.log("DEBUG: Request headers:", Object.fromEntries(request.headers.entries()))

    // Check if the data matches expected format
    const expectedFields = ["toolId", "purpose", "priority", "requestedDays"]
    const missingFields = expectedFields.filter((field) => !(field in body))

    if (missingFields.length > 0) {
      console.log("DEBUG: Missing fields:", missingFields)
    }

    // Check priority value
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
    if (!validPriorities.includes(body.priority)) {
      console.log("DEBUG: Invalid priority value:", body.priority)
      console.log("DEBUG: Valid priorities:", validPriorities)
    }

    return NextResponse.json({
      success: true,
      receivedData: body,
      validation: {
        missingFields,
        validPriority: validPriorities.includes(body.priority),
        expectedPriorities: validPriorities,
      },
    })
  } catch (error) {
    console.error("DEBUG: Error processing request:", error)
    return NextResponse.json({ error: "Failed to process debug request", details: error.message }, { status: 500 })
  }
}
