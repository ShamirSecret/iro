import { NextResponse } from "next/server"
import { getDistributorByWallet } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { address: string } }) {
  try {
    const distributor = await getDistributorByWallet(params.address)

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    return NextResponse.json(distributor)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch distributor" }, { status: 500 })
  }
}
