import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

// 更新管理员信息
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name, email, walletAddress } = await request.json()
    const adminId = params.id

    if (!name || !email || !walletAddress) {
      return NextResponse.json({ error: "所有字段都是必填的" }, { status: 400 })
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "请输入有效的以太坊钱包地址" }, { status: 400 })
    }

    // 检查钱包地址是否被其他用户使用
    const existingUser = await sql`
      SELECT id FROM distributors WHERE wallet_address = ${walletAddress} AND id != ${adminId}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "该钱包地址已被其他用户注册" }, { status: 400 })
    }

    // 检查邮箱是否被其他用户使用
    const existingEmail = await sql`
      SELECT id FROM distributors WHERE email = ${email} AND id != ${adminId}
    `

    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "该邮箱已被其他用户注册" }, { status: 400 })
    }

    const result = await sql`
      UPDATE distributors 
      SET name = ${name}, email = ${email}, wallet_address = ${walletAddress}
      WHERE id = ${adminId} AND role = 'admin'
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, total_points, personal_points, commission_points
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "管理员不存在或无权限" }, { status: 404 })
    }

    return NextResponse.json({
      message: "管理员信息更新成功",
      admin: result[0],
    })
  } catch (error) {
    console.error("Error updating admin:", error)
    return NextResponse.json({ error: "更新管理员失败" }, { status: 500 })
  }
}

// 删除管理员
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = params.id

    // 检查是否是主管理员（不能删除）
    const adminToDelete = await sql`
      SELECT wallet_address FROM distributors WHERE id = ${adminId} AND role = 'admin'
    `

    if (adminToDelete.length === 0) {
      return NextResponse.json({ error: "管理员不存在" }, { status: 404 })
    }

    // 禁止删除主管理员
    if (adminToDelete[0].wallet_address === "0x442368f7b5192f9164a11a5387194cb5718673b9") {
      return NextResponse.json({ error: "不能删除主管理员" }, { status: 403 })
    }

    await sql`
      DELETE FROM distributors WHERE id = ${adminId} AND role = 'admin'
    `

    return NextResponse.json({ message: "管理员删除成功" })
  } catch (error) {
    console.error("Error deleting admin:", error)
    return NextResponse.json({ error: "删除管理员失败" }, { status: 500 })
  }
}
