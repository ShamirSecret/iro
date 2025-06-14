import { NextResponse } from "next/server"
import { getAllDistributors } from "@/lib/database"
import { jwtVerify } from "jose"

// 只允许带有有效管理 token 的请求
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function GET(request: Request) {
  // 校验 JWT 登录态
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const token = authHeader.split(" ")[1]
  try {
    await jwtVerify(token, JWT_SECRET)
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    const distributors = await getAllDistributors()
    return NextResponse.json(distributors)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch distributors" }, { status: 500 })
  }
}
