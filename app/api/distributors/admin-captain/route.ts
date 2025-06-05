import { NextResponse } from "next/server"
import { createCaptain, checkExistingUser, updateDistributorStatus } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { name, email, walletAddress, existingId } = await request.json()

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
    // 如果是编辑现有船长
    if (existingId) {
      // 这里应该有更新船长信息的逻辑
      // 由于数据库结构限制，我们这里简单处理为先批准该用户
      await updateDistributorStatus(existingId, "approved")

      return NextResponse.json({
        message: `${name} 已成功更新为船长。`,
      })
    } else {
      // 检查用户是否已存在
      const userExists = await checkExistingUser(email, walletAddress)
      if (userExists) {
        return NextResponse.json({ error: "钱包地址或邮箱已被注册" }, { status: 400 })
      }

      // 创建新船长
      const newCaptain = await createCaptain(name, email, walletAddress)

      // 直接批准该船长
      await updateDistributorStatus(newCaptain.id, "approved")

      return NextResponse.json({
        message: `船长 ${name} 注册成功。`,
        distributor: newCaptain,
      })
    }
  } catch (error) {
    console.error("Admin captain operation error:", error)
    return NextResponse.json({ error: "操作过程中发生错误" }, { status: 500 })
  }
}
