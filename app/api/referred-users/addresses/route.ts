import { NextResponse } from "next/server"
import { getReferredUserAddresses } from "@/lib/database"

// 获取推荐用户地址接口，支持按创建时间增量拉取
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const since = searchParams.get("since") || undefined
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 100

  if (isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: "limit 必须是正整数" }, { status: 400 })
  }

  try {
    const rows = await getReferredUserAddresses({ since, limit })
    const nextSince = rows.length > 0 ? rows[rows.length - 1].createdAt : since

    return NextResponse.json({ addresses: rows, nextSince })
  } catch (error: any) {
    console.error("获取推荐用户地址时出错：", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 