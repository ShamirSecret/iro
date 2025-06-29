import { NextResponse } from "next/server"
import { jwtVerify } from 'jose'
import { updateDistributor } from "@/lib/database"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 验证 JWT
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const token = authHeader.split(" ")[1]
  
  // 验证 JWT 并提取 payload
  let payload
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    payload = verified.payload
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  
  // 只有管理员可以更新分销商信息
  if ((payload as any).role !== "admin") {
    return NextResponse.json({ error: "只有管理员可以更新分销商信息" }, { status: 403 })
  }

  try {
    const { name, email } = await request.json()
    
    // 验证输入
    if (!name || !email) {
      return NextResponse.json({ error: "名称和邮箱都是必填的" }, { status: 400 })
    }
    
    if (!/^[A-Za-z0-9]{3,20}$/.test(name)) {
      return NextResponse.json({ error: "用户名只能由3-20位字母和数字组成。" }, { status: 400 })
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 50) {
      return NextResponse.json({ error: "请输入有效的邮箱地址，且长度不超过50个字符。" }, { status: 400 })
    }
    
    // 更新分销商信息
    const updatedDistributor = await updateDistributor(params.id, name, email)
    
    return NextResponse.json({
      message: "分销商信息更新成功",
      distributor: updatedDistributor
    })
  } catch (error) {
    console.error("Update distributor error:", error)
    return NextResponse.json({ error: "更新分销商信息失败" }, { status: 500 })
  }
} 