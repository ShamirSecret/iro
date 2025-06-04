import { NextResponse } from "next/server"
import { getDistributorByWallet } from "@/lib/database"
import { verifyMessage } from "ethers" // Changed from ethers/lib/utils

const ADMIN_WALLET_ADDRESS = "0x442368f7b5192f9164a11a5387194cb5718673b9"

export async function POST(request: Request) {
  try {
    const { address, nonce, signature } = await request.json()

    if (!address || !nonce || !signature) {
      return NextResponse.json({ error: "缺少必要的参数：地址、Nonce 或签名。" }, { status: 400 })
    }

    // 模拟登录模式 - 仅用于开发环境
    const isMockSignature = signature === "0x" + "1".repeat(130)
    if (isMockSignature) {
      console.log("使用模拟签名登录:", address)

      // 检查是否是管理员地址
      const isAdminAddress = address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
      const distributor = await getDistributorByWallet(address)

      if (isAdminAddress) {
        if (!distributor || distributor.role !== "admin") {
          const adminUser = {
            id: distributor?.id || "admin-" + Date.now(),
            walletAddress: address,
            name: "平台管理员",
            email: distributor?.email || "admin@picwe.com",
            role: "admin" as const,
            roleType: "admin" as const,
            status: "approved" as const,
            registrationTimestamp: distributor?.registrationTimestamp || Date.now(),
            registrationDate: (() => {
              try {
                return distributor?.registrationDate || new Date().toISOString().split("T")[0]
              } catch (error) {
                console.error("Date formatting error in admin user creation:", error)
                return new Date().toLocaleDateString("zh-CN")
              }
            })(),
            referralCode: distributor?.referralCode || "ADMINXYZ",
            totalPoints: distributor?.totalPoints || 0,
            personalPoints: distributor?.personalPoints || 0,
            commissionPoints: distributor?.commissionPoints || 0,
            referredUsers: distributor?.referredUsers || [],
          }
          return NextResponse.json({
            message: "管理员登录成功！",
            distributor: adminUser,
          })
        }
      }

      if (!distributor) {
        return NextResponse.json({ error: "该钱包地址未注册。请先注册。" }, { status: 404 })
      }

      if (distributor.status === "rejected") {
        return NextResponse.json({ error: "您的账户申请已被拒绝。" }, { status: 403 })
      }

      return NextResponse.json({
        message: "登录成功！",
        distributor,
      })
    }

    // 正常签名验证流程
    if (!signature.startsWith("0x") || signature.length < 130) {
      return NextResponse.json({ error: "签名格式无效。" }, { status: 401 })
    }

    if (!address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json({ error: "钱包地址格式无效。" }, { status: 401 })
    }

    // 重新构建消息以进行验证
    const messageToVerify = `请签名此消息以验证您的身份：\n\n随机码: ${nonce}\n\n此操作不会产生任何费用。`

    let recoveredAddress
    try {
      recoveredAddress = verifyMessage(messageToVerify, signature)
    } catch (e: any) {
      console.error("Signature verification error:", e)
      return NextResponse.json({ error: `签名验证失败: ${e.message}` }, { status: 401 })
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.warn("Recovered address does not match provided address:", {
        recovered: recoveredAddress.toLowerCase(),
        provided: address.toLowerCase(),
      })
      return NextResponse.json({ error: "签名无效或与提供的地址不匹配。" }, { status: 401 })
    }

    console.log("Signature successfully verified for address:", address)

    const isAdminAddress = address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
    const distributor = await getDistributorByWallet(address)

    if (isAdminAddress) {
      if (!distributor || distributor.role !== "admin") {
        const adminUser = {
          id: distributor?.id || "admin-" + Date.now(), // Use existing ID if admin record exists but role is wrong
          walletAddress: address,
          name: "平台管理员",
          email: distributor?.email || "admin@picwe.com",
          role: "admin" as const,
          roleType: "admin" as const,
          status: "approved" as const,
          registrationTimestamp: distributor?.registrationTimestamp || Date.now(),
          registrationDate: (() => {
            try {
              return distributor?.registrationDate || new Date().toISOString().split("T")[0]
            } catch (error) {
              console.error("Date formatting error in admin user creation:", error)
              return new Date().toLocaleDateString("zh-CN")
            }
          })(),
          referralCode: distributor?.referralCode || "ADMINXYZ",
          totalPoints: distributor?.totalPoints || 0,
          personalPoints: distributor?.personalPoints || 0,
          commissionPoints: distributor?.commissionPoints || 0,
          referredUsers: distributor?.referredUsers || [],
        }
        // Optionally, upsert this admin record into the database here if it's missing or incorrect
        // For now, we'll proceed with the constructed object for login
        return NextResponse.json({
          message: "管理员登录成功！",
          distributor: adminUser,
        })
      }
    }

    if (!distributor) {
      return NextResponse.json({ error: "该钱包地址未注册。请先注册。" }, { status: 404 })
    }

    if (distributor.status === "rejected") {
      return NextResponse.json({ error: "您的账户申请已被拒绝。" }, { status: 403 })
    }

    // Ensure admin role is correctly set if it's the admin address
    if (isAdminAddress && distributor.role !== "admin") {
      distributor.role = "admin"
      distributor.roleType = "admin"
      distributor.status = "approved"
    }

    return NextResponse.json({
      message: "登录成功！",
      distributor,
    })
  } catch (error: any) {
    console.error("Login verification error:", error)
    return NextResponse.json({ error: `登录验证过程中发生服务器错误: ${error.message}` }, { status: 500 })
  }
}
