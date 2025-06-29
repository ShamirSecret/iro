import { NextResponse } from "next/server"
import { updateAllDistributorTitles } from "@/lib/database"

export async function GET() {
  try {
    // 更新所有分销商的头衔
    await updateAllDistributorTitles()
    
    return NextResponse.json({ 
      success: true, 
      message: "所有分销商头衔已更新",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating distributor titles:", error)
    return NextResponse.json({ 
      success: false, 
      error: "更新头衔失败",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 也支持手动POST请求触发
export async function POST() {
  return GET()
} 