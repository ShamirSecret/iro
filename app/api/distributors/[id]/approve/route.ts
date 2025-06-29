import { NextResponse } from "next/server"
import { approveDistributorWithUpline } from "@/lib/database"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // 从中间件获取用户信息
    const userHeader = request.headers.get('x-user')
    console.log("Approve - User header:", userHeader)
    
    if (!userHeader) {
      console.log("Approve - No user header found")
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const user = JSON.parse(userHeader)
    console.log("Approve - Parsed user:", user)
    
    // 检查是否为管理员
    if (user.role !== 'admin') {
      console.log("Approve - User role is not admin:", user.role)
      return NextResponse.json({ error: "只有管理员可以批准船长申请" }, { status: 403 })
    }

    console.log("Approve - User is admin, proceeding with approval for ID:", params.id)
    await approveDistributorWithUpline(params.id)
    return NextResponse.json({ message: "用户已批准并设置上级" })
  } catch (error) {
    console.error("Approve error:", error)
    return NextResponse.json({ error: "批准失败" }, { status: 500 })
  }
}
