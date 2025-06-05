import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // 使用 UTC 时间戳
    const timestamp = Date.now(); // 已经是 UTC
    
    // 生成 nonce
    const nonce = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
    
    // 尝试插入数据库
    try {
      await sql`
        INSERT INTO nonces (nonce, used)
        VALUES (${nonce}, false)
      `;
    } catch (dbError) {
      console.error("数据库插入错误:", dbError);
      // 数据库错误时仍返回 nonce
      return NextResponse.json({ nonce });
    }

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("生成 nonce 错误:", error);
    // 即使出错也返回 nonce，确保前端可用
    const fallbackNonce = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    return NextResponse.json({ nonce: fallbackNonce });
  }
}
