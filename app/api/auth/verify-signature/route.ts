import { NextResponse } from "next/server"
import { getDistributorByWallet } from "@/lib/database"
import { verifyMessage } from "ethers" // Changed from ethers/lib/utils
import { sql } from "@/lib/database"
import { SignJWT } from 'jose'

const ADMIN_WALLET_ADDRESS = "0x442368f7b5192f9164a11a5387194cb5718673b9"

export async function POST(request: Request) {
  try {
    const { address, nonce, signature } = await request.json()

    if (!address || !nonce || !signature) {
      return NextResponse.json({ error: "缺少必要的参数：地址、Nonce 或签名。" }, { status: 400 })
    }

    // nonce 校验
    const NONCE_EXPIRE_SECONDS = 300 // 5分钟
    const nonceResult = await sql`
      SELECT id, created_at, used FROM nonces WHERE nonce = ${nonce} LIMIT 1
    `
    if (nonceResult.length === 0) {
      return NextResponse.json({ error: "无效的随机码（nonce）。" }, { status: 400 })
    }
    const nonceRow = nonceResult[0]
    if (nonceRow.used) {
      return NextResponse.json({ error: "该随机码已被使用，请刷新重试。" }, { status: 400 })
    }
    const createdAt = new Date(nonceRow.created_at)
    const currentTime = Date.now();
    const [timestampStr] = nonce.split('-');
    const generatedTime = parseInt(timestampStr, 10);
    const elapsed = currentTime - generatedTime;

    // 从5分钟延长到10分钟 + 30秒缓冲
    const MAX_VALID_DURATION = 630000; // 10.5分钟

    if (elapsed > MAX_VALID_DURATION) {
      return NextResponse.json(
        { error: `随机码已过期 (${Math.round(elapsed/1000)}秒)` },
        { status: 400 }
      );
    }

    // 正常签名验证流程
    if (!signature.startsWith("0x") || signature.length < 130) {
      return NextResponse.json({ error: "签名格式无效。" }, { status: 401 })
    }

    if (!address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json({ error: "钱包地址格式无效。" }, { status: 401 })
    }

    // 重新构建消息以进行验证
    const messageToVerify = `Please sign this message to verify your identity:\n\nNonce: ${nonce}\n\nThis operation will not incur any fees.`

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

    // 验证通过后，标记 nonce 为已用
    await sql`UPDATE nonces SET used = true WHERE nonce = ${nonce}`

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
        // 生成 JWT
        const jwt = await new SignJWT({ address, id: adminUser.id, role: adminUser.role })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(new TextEncoder().encode(process.env.JWT_SECRET!))
        return NextResponse.json({
          message: '管理员登录成功！',
          distributor: adminUser,
          token: jwt
        })
      }
    }

    if (!distributor) {
      return NextResponse.json({ error: "该钱包地址未注册。请先注册。" }, { status: 404 })
    }

    if (distributor.status === "rejected") {
      return NextResponse.json({ error: "您的账户申请已被拒绝。" }, { status: 403 })
    }

    // Ensure admin role is correctly set if it's the admin address or if user is admin in database
    if (isAdminAddress && distributor.role !== "admin") {
      distributor.role = "admin"
      distributor.roleType = "admin"
      distributor.status = "approved"
    }

    // 登录通过后，生成 JWT - 确保数据库中的admin角色被正确包含在JWT中
    const jwt = await new SignJWT({ address, id: distributor.id, role: distributor.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!))

    return NextResponse.json({
      message: "登录成功！",
      distributor,
      token: jwt
    })
  } catch (error: any) {
    console.error("Login verification error:", error)
    return NextResponse.json({ error: `登录验证过程中发生服务器错误: ${error.message}` }, { status: 500 })
  }
}
