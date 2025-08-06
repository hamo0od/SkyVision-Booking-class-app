import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Don't include Authorization header for login requests
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Login failed: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 })
  }
}
