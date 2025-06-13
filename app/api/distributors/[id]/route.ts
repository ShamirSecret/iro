import { NextResponse } from "next/server"
import { jwtVerify } from 'jose'
import { deleteDistributor, clearUplineForDistributors, getDistributorById, updateDistributorStatus } from "@/lib/database"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

// 初始管理员钱包地址
const INITIAL_ADMIN_WALLET_ADDRESS = "0x442368f7b5192f9164a11a5387194cb5718673b9"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 验证 JWT
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const token = authHeader.split(" ")[1]
  // 验证 JWT 并提取 payload
  let payload;
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    payload = verified.payload;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  // 非初始管理员仅标记停用
  const userAddr = (payload as any).address?.toLowerCase()
  if ((payload as any).role === "admin" && userAddr !== INITIAL_ADMIN_WALLET_ADDRESS.toLowerCase()) {
    // 标记为 rejected 视作停用
    await updateDistributorStatus(params.id, "rejected")
    return NextResponse.json({ message: "您不是初始管理员，已将此用户标记为停用" })
  }

  const { id } = params
  // 查询分销商
  const distributor = await getDistributorById(id)
  if (!distributor) {
    return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
  }

  // 如果是船长，则先清除下线关系
  if (distributor.roleType === "captain") {
    await clearUplineForDistributors(id)
  }
  // 删除分销商
  await deleteDistributor(id)
  return NextResponse.json({ message: "Distributor deleted successfully" })
} 