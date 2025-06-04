import { NextResponse } from "next/server"
import { processDailySnapshotAndCommissions } from "@/lib/database"

// This key should be set in your .env.local or Vercel environment variables
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("Unauthorized attempt to trigger daily snapshot POST.")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("Attempting to start daily snapshot processing via POST...")
    const result = await processDailySnapshotAndCommissions()
    console.log("Daily snapshot POST processing finished:", result)

    if (result.success) {
      return NextResponse.json({ message: result.message, processedCount: result.count })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in daily-snapshot POST API route:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}

export async function GET(request: Request) {
  // Allow GET for manual trigger during development if CRON_SECRET is not set or matches
  const authHeader = request.headers.get("Authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("Unauthorized attempt to trigger daily snapshot GET.")
    return NextResponse.json({ error: "Unauthorized for GET" }, { status: 401 })
  }

  console.warn(
    "Manually triggering daily snapshot via GET request. This should be a POST request from a cron job in production if CRON_SECRET is enforced.",
  )
  try {
    console.log("Attempting to start daily snapshot processing via GET (manual)...")
    const result = await processDailySnapshotAndCommissions()
    console.log("Daily snapshot GET processing finished (manual):", result)

    if (result.success) {
      return NextResponse.json({ message: result.message, processedCount: result.count })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in daily-snapshot GET API route (manual):", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
