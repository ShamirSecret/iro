import { NextResponse } from "next/server"
import { updateDistributorStatus } from "@/lib/database"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await updateDistributorStatus(params.id, "rejected")
    return NextResponse.json({ message: "船员已拒绝" })
  } catch (error) {
    console.error("Reject error:", error)
    return NextResponse.json({ error: "拒绝失败" }, { status: 500 })
  }
}
