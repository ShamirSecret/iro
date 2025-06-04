import { NextResponse } from "next/server"
import { createCaptain, checkExistingUser } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { name, email, walletAddress } = await request.json()

    // 验证输入
    if (!name || !email || !walletAddress) {
      return NextResponse.json({ error: "所有字段都是必填的" }, { status: 400 })
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "请输入有效的以太坊钱包地址" }, { status: 400 })
    }

    // 检查用户是否已存在
    const userExists = await checkExistingUser(email, walletAddress)
    if (userExists) {
      return NextResponse.json({ error: "钱包地址或邮箱已被注册" }, { status: 400 })
    }

    // 创建船长
    const newCaptain = await createCaptain(name, email, walletAddress)

    return NextResponse.json({
      message: "船长申请提交成功！请等待管理员审核。",
      distributor: newCaptain,
    })
  } catch (error) {
    console.error("Captain registration error:", error)
    return NextResponse.json({ error: "注册过程中发生错误" }, { status: 500 })
  }
}
