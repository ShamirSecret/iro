import { NextResponse } from "next/server"
import { createCrew, getDistributorByReferralCode, checkExistingUser } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { name, email, walletAddress, uplineReferralCode } = await request.json()

    // 验证基本输入
    if (!name || !email || !walletAddress) {
      return NextResponse.json({ error: "姓名、邮箱和钱包地址是必填的" }, { status: 400 })
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "请输入有效的以太坊钱包地址" }, { status: 400 })
    }

    // 检查用户是否已存在
    const userExists = await checkExistingUser(email, walletAddress)
    if (userExists) {
      return NextResponse.json({ error: "钱包地址或邮箱已被注册" }, { status: 400 })
    }

    // 如果有邀请码，验证邀请码
    if (uplineReferralCode && uplineReferralCode.trim()) {
      const upline = await getDistributorByReferralCode(uplineReferralCode.trim())
      if (!upline) {
        return NextResponse.json({ error: "无效的邀请码" }, { status: 400 })
      }

      if (upline.status !== "approved") {
        return NextResponse.json({ error: "邀请人账户未激活或无效" }, { status: 400 })
      }

      // 使用邀请码创建船员（立即批准）
      const newCrew = await createCrew(name, email, walletAddress, upline.id)

      return NextResponse.json({
        message: "注册成功！您现在可以登录了。",
        distributor: newCrew,
      })
    } else {
      // 没有邀请码时返回错误，建议使用直接注册
      return NextResponse.json({ 
        error: "请提供邀请码，或使用直接注册（需要审核）" 
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "注册过程中发生错误" }, { status: 500 })
  }
}
