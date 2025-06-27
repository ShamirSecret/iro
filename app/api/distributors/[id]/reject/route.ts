import { NextResponse } from "next/server"
import { updateDistributorStatus } from "@/lib/database"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // 从中间件获取用户信息
    const userHeader = request.headers.get('x-user')
    if (!userHeader) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const user = JSON.parse(userHeader)
    
    // 检查是否为管理员
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "只有管理员可以拒绝船长申请" }, { status: 403 })
    }

    await updateDistributorStatus(params.id, "rejected")
    return NextResponse.json({ message: "船员已拒绝" })
  } catch (error) {
    console.error("Reject error:", error)
    return NextResponse.json({ error: "拒绝失败" }, { status: 500 })
  }
}
