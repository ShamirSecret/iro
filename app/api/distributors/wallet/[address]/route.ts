import { NextResponse } from "next/server"
import { getDistributorByWallet, sql } from "@/lib/database"
import { jwtVerify } from 'jose'

// 只允许查看自己的钱包信息
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function GET(request: Request, { params }: { params: { address: string } }) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if ((payload.address as string).toLowerCase() !== params.address.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const distributor = await getDistributorByWallet(params.address)

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const balanceResult = await sql`
      SELECT wusd_balance FROM distributor_balances WHERE distributor_id = ${distributor.id} LIMIT 1
    `
    const wusdBalance = balanceResult.length ? balanceResult[0].wusd_balance : 0

    return NextResponse.json({ ...distributor, wusdBalance })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch distributor" }, { status: 500 })
  }
}
