import { NextResponse } from "next/server"
import { createCrew, getDistributorByReferralCode, checkExistingUser } from "@/lib/database"

export async function POST(request: Request) {
  try {
    console.log("Registration request received")
    const body = await request.json()
    console.log("Request body:", body)
    
    const { name, email, walletAddress, uplineReferralCode } = body

    // 验证基本输入
    if (!name || !email || !walletAddress) {
      console.log("Missing required fields:", { name: !!name, email: !!email, walletAddress: !!walletAddress })
      return NextResponse.json({ error: "姓名、邮箱和钱包地址是必填的" }, { status: 400 })
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      console.log("Invalid wallet address:", walletAddress)
      return NextResponse.json({ error: "请输入有效的以太坊钱包地址" }, { status: 400 })
    }

    // 用户名校验
    if (!/^[A-Za-z0-9]{3,20}$/.test(name)) {
      console.log("Invalid username:", name)
      return NextResponse.json({ error: "用户名只能由3-20位字母和数字组成。" }, { status: 400 })
    }

    // 邮箱校验
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 50) {
      console.log("Invalid email:", email)
      return NextResponse.json({ error: "请输入有效的邮箱地址，且长度不超过50个字符。" }, { status: 400 })
    }

    console.log("Validation passed, checking existing user...")

    // 检查用户是否已存在
    const userExists = await checkExistingUser(email, walletAddress)
    if (userExists) {
      console.log("User already exists:", { email, walletAddress })
      return NextResponse.json({ error: "钱包地址或邮箱已被注册" }, { status: 400 })
    }

    console.log("User doesn't exist, processing invitation code...")

    let uplineId: string | undefined = undefined

    // 如果有邀请码，验证邀请码
    if (uplineReferralCode && uplineReferralCode.trim()) {
      console.log("Validating invitation code:", uplineReferralCode.trim())
      const upline = await getDistributorByReferralCode(uplineReferralCode.trim())
      if (!upline) {
        console.log("Invalid invitation code:", uplineReferralCode.trim())
        return NextResponse.json({ error: "无效的邀请码" }, { status: 400 })
      }

      if (upline.status !== "approved") {
        console.log("Upline not approved:", upline.status)
        return NextResponse.json({ error: "邀请人账户未激活或无效" }, { status: 400 })
      }

      uplineId = upline.id
      console.log("Valid upline found:", uplineId)
    } else {
      console.log("No invitation code provided")
    }

    console.log("Creating new user...")

    // 创建新用户（有邀请码立即批准，无邀请码需要审核）
    const newUser = await createCrew(name, email, walletAddress, uplineId)

    console.log("User created successfully:", newUser.id)

    const message = uplineId 
      ? "注册成功！您现在可以登录了。" 
      : "申请提交成功！请等待管理员审核。"

    return NextResponse.json({
      message,
      distributor: newUser,
    })
  } catch (error: any) {
    console.error("Registration error:", error)
    console.error("Error stack:", error?.stack)
    return NextResponse.json({ 
      error: "注册过程中发生错误", 
      details: error?.message || "Unknown error"
    }, { status: 500 })
  }
}
