// This is a MOCK API route for testing the points distribution.
// In a real system, this logic would be triggered by actual WUSD balance updates.
import { NextResponse } from "next/server"
import { processPointsFromWusdBalance } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { referredCustomerAddress, newWusdBalance } = await request.json()

    if (!referredCustomerAddress || typeof newWusdBalance !== "number") {
      return NextResponse.json({ error: "Missing referredCustomerAddress or newWusdBalance" }, { status: 400 })
    }

    // Default conversion and commission rates, can be overridden if needed
    const WUSD_TO_POINTS_RATE = 1
    const UPLINE_COMMISSION_RATE = 0.1 // 10%
    const MAX_COMMISSION_LEVELS = 5

    const result = await processPointsFromWusdBalance(
      referredCustomerAddress,
      newWusdBalance,
      WUSD_TO_POINTS_RATE,
      UPLINE_COMMISSION_RATE,
      MAX_COMMISSION_LEVELS,
    )

    if (result.success) {
      return NextResponse.json({ message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in mock trigger-referral-points:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
