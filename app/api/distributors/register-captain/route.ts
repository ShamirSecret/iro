import { NextResponse } from "next/server"
import { createCaptain, checkExistingUser } from "@/lib/database"

export async function POST(request: Request) {
  // 解析请求体
  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: "请求体解析失败，请确保发送有效的 JSON" }, { status: 400 })
  }

  const { name, email, walletAddress } = body

  // 验证输入
  if (!name || !email || !walletAddress) {
    return NextResponse.json({ error: "所有字段都是必填的" }, { status: 400 })
  }

  if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
    return NextResponse.json({ error: "请输入有效的以太坊钱包地址" }, { status: 400 })
  }

  if (!/^[A-Za-z0-9]{3,20}$/.test(name)) {
    return NextResponse.json({ error: "用户名只能由3-20位字母和数字组成。" }, { status: 400 })
  }

  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 50) {
    return NextResponse.json({ error: "请输入有效的邮箱地址，且长度不超过50个字符。" }, { status: 400 });
  }

  try {
    // 检查用户是否已存在
    const userExists = await checkExistingUser(email, walletAddress)
    if (userExists) {
      return NextResponse.json({ error: "钱包地址或邮箱已被注册" }, { status: 400 })
    }

    // 创建新用户（需要审核）
    const newUser = await createCaptain(name, email, walletAddress)
    return NextResponse.json({
      message: "申请提交成功！请等待管理员审核。",
      distributor: newUser,
    })
  } catch (error) {
    console.error("Captain registration error:", error)
    return NextResponse.json({ error: "注册过程中发生错误" }, { status: 500 })
  }
}
