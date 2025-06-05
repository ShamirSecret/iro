import { NextResponse } from "next/server"
import { getDistributorByWallet, sql } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { address: string } }) {
  try {
    const distributor = await getDistributorByWallet(params.address)

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const balanceResult = await sql`
      SELECT wusd_balance FROM distributor_balances WHERE distributor_id = ${distributor.id} LIMIT 1
    `
    const wusdBalance = balanceResult.length ? balanceResult[0].wusd_balance : 0

    return NextResponse.json({ ...distributor, wusdBalance })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch distributor" }, { status: 500 })
  }
}
