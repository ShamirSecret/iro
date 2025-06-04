import { NextResponse } from "next/server"
import { getAllDistributors } from "@/lib/database"

export async function GET() {
  try {
    const distributors = await getAllDistributors()
    return NextResponse.json(distributors)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch distributors" }, { status: 500 })
  }
}
