import { NextResponse } from "next/server"
import { createCrew, getDistributorByReferralCode, checkExistingUser } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { name, email, walletAddress, uplineReferralCode } = await request.json()

    // 验证输入
    if (!name || !email || !walletAddress || !uplineReferralCode) {
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

    // 验证邀请码
    const upline = await getDistributorByReferralCode(uplineReferralCode)
    if (!upline) {
      return NextResponse.json({ error: "无效的邀请码" }, { status: 400 })
    }

    if (upline.status !== "approved") {
      return NextResponse.json({ error: "邀请人账户未激活或无效" }, { status: 400 })
    }

    // 创建船员
    const newCrew = await createCrew(name, email, walletAddress, upline.id)

    return NextResponse.json({
      message: "船员注册成功！您现在可以登录了。",
      distributor: newCrew,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "注册过程中发生错误" }, { status: 500 })
  }
}
