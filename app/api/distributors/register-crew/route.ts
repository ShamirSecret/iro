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

    // 用户名校验
    if (!/^[A-Za-z0-9]{3,20}$/.test(name)) {
      return NextResponse.json({ error: "用户名只能由3-20位字母和数字组成。" }, { status: 400 })
    }

    // 邮箱校验
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 50) {
      return NextResponse.json({ error: "请输入有效的邮箱地址，且长度不超过50个字符。" }, { status: 400 })
    }

    // 检查用户是否已存在
    const userExists = await checkExistingUser(email, walletAddress)
    if (userExists) {
      return NextResponse.json({ error: "钱包地址或邮箱已被注册" }, { status: 400 })
    }

    let uplineId: string | undefined = undefined

    // 如果有邀请码，验证邀请码
    if (uplineReferralCode && uplineReferralCode.trim()) {
      const upline = await getDistributorByReferralCode(uplineReferralCode.trim())
      if (!upline) {
        return NextResponse.json({ error: "无效的邀请码" }, { status: 400 })
      }

      if (upline.status !== "approved") {
        return NextResponse.json({ error: "邀请人账户未激活或无效" }, { status: 400 })
      }

      uplineId = upline.id
    }

    // 创建新用户（有邀请码立即批准，无邀请码需要审核）
    const newUser = await createCrew(name, email, walletAddress, uplineId)

    const message = uplineId 
      ? "注册成功！您现在可以登录了。" 
      : "申请提交成功！请等待管理员审核。"

    return NextResponse.json({
      message,
      distributor: newUser,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "注册过程中发生错误" }, { status: 500 })
  }
}
