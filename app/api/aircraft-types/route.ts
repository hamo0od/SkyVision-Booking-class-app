import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Fetching aircraft types...")

    // First check if the table exists and get data
    let aircraftTypes = []
    try {
      aircraftTypes = await prisma.aircraftType.findMany({
        orderBy: { name: "asc" },
      })
      console.log("Found aircraft types:", aircraftTypes)
    } catch (error) {
      console.error("Error fetching aircraft types, table may not exist:", error)
      // Return sample data if table doesn't exist
      aircraftTypes = [
        { id: "1", name: "Boeing 737", description: "Boeing 737 series" },
        { id: "2", name: "Airbus A320", description: "Airbus A320 family" },
        { id: "3", name: "Boeing 777", description: "Boeing 777 wide-body" },
        { id: "4", name: "Embraer E190", description: "Embraer E-Jet family" },
      ]
      console.log("Using sample aircraft types:", aircraftTypes)
    }

    return NextResponse.json(aircraftTypes)
  } catch (error) {
    console.error("Error in aircraft types API:", error)
    return NextResponse.json({ error: "Failed to fetch aircraft types" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    const aircraftType = await prisma.aircraftType.create({
      data: { name, description },
    })

    return NextResponse.json(aircraftType, { status: 201 })
  } catch (error) {
    console.error("Error creating aircraft type:", error)
    return NextResponse.json({ error: "Failed to create aircraft type" }, { status: 500 })
  }
}
