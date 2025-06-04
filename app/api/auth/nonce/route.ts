import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 生成一个基于时间戳和随机数的 nonce
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 15)
    const nonce = `${timestamp}-${randomPart}`

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error("Error generating nonce:", error)
    return NextResponse.json({ error: "无法生成签名挑战。" }, { status: 500 })
  }
}
