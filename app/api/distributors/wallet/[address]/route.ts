import { NextResponse, NextRequest } from "next/server"
import { getDistributorByWallet } from "@/lib/database"
import { jwtVerify } from 'jose'

// 只允许查看自己的钱包信息
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function GET(
  request: NextRequest, 
  { params }: { params: { address: string } }
) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { address } = await params;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if ((payload.address as string).toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const distributor = await getDistributorByWallet(address)

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    // 直接返回 distributor 数据，不再查询 distributor_balances 表
    // 如果需要 wusdBalance，可以从 distributor.referredUsers 中计算
    const wusdBalance = 0; // 默认值为0，也可以从其他地方获取

    return NextResponse.json({ 
      ...distributor, 
      wusdBalance 
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch distributor" }, { status: 500 })
  }
}
