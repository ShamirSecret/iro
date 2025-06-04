import { NextResponse } from "next/server"
import { updateDistributorStatus } from "@/lib/database"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await updateDistributorStatus(params.id, "approved")
    return NextResponse.json({ message: "经销商已批准" })
  } catch (error) {
    console.error("Approve error:", error)
    return NextResponse.json({ error: "批准失败" }, { status: 500 })
  }
}
