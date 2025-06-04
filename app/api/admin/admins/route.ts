import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

// 获取所有管理员
export async function GET() {
  try {
    const admins = await sql`
      SELECT 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, total_points, personal_points, commission_points
      FROM distributors 
      WHERE role = 'admin'
      ORDER BY registration_timestamp DESC
    `

    return NextResponse.json(admins)
  } catch (error) {
    console.error("Error fetching admins:", error)
    return NextResponse.json({ error: "获取管理员列表失败" }, { status: 500 })
  }
}

// 添加新管理员
export async function POST(request: Request) {
  try {
    const { name, email, walletAddress } = await request.json()

    if (!name || !email || !walletAddress) {
      return NextResponse.json({ error: "所有字段都是必填的" }, { status: 400 })
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "请输入有效的以太坊钱包地址" }, { status: 400 })
    }

    // 检查钱包地址是否已存在
    const existingUser = await sql`
      SELECT id FROM distributors WHERE wallet_address = ${walletAddress}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "该钱包地址已被注册" }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existingEmail = await sql`
      SELECT id FROM distributors WHERE email = ${email}
    `

    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 })
    }

    const timestamp = Date.now()
    const referralCode = `ADMIN${timestamp.toString().slice(-6)}`

    const result = await sql`
      INSERT INTO distributors (
        wallet_address, name, email, role, role_type, status,
        registration_timestamp, referral_code, total_points, personal_points, commission_points
      ) VALUES (
        ${walletAddress}, ${name}, ${email}, 'admin', 'admin', 'approved',
        ${timestamp}, ${referralCode}, 0, 0, 0
      )
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, total_points, personal_points, commission_points
    `

    return NextResponse.json({
      message: "管理员添加成功",
      admin: result[0],
    })
  } catch (error) {
    console.error("Error adding admin:", error)
    return NextResponse.json({ error: "添加管理员失败" }, { status: 500 })
  }
}
