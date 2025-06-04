import { NextResponse } from "next/server"
import { addPointsToDistributor, getAllDistributors } from "@/lib/database"

const UPLINE_COMMISSION_RATE = 0.1

export async function POST(request: Request) {
  try {
    const { distributorId, points, isDirectEarning } = await request.json()

    if (!distributorId || !points || typeof isDirectEarning !== "boolean") {
      return NextResponse.json({ error: "参数无效" }, { status: 400 })
    }

    // 获取所有船员数据以便计算佣金链
    const allDistributors = await getAllDistributors()
    const distributor = allDistributors.find((d) => d.id === distributorId)

    if (!distributor) {
      return NextResponse.json({ error: "船员不存在" }, { status: 404 })
    }

    // 给直接船员加分
    if (isDirectEarning) {
      await addPointsToDistributor(distributorId, points, "personal")
    } else {
      await addPointsToDistributor(distributorId, points, "commission")
    }

    // 计算上级佣金
    let currentUplineId = distributor.uplineDistributorId
    const pointsForCommission = points

    while (currentUplineId) {
      const uplineMember = allDistributors.find((d) => d.id === currentUplineId)
      if (!uplineMember) break

      const commissionAmount = Math.floor(pointsForCommission * UPLINE_COMMISSION_RATE)

      if (commissionAmount > 0) {
        await addPointsToDistributor(currentUplineId, commissionAmount, "commission")
      } else {
        break
      }

      currentUplineId = uplineMember.uplineDistributorId
    }

    return NextResponse.json({ message: "积分添加成功" })
  } catch (error) {
    console.error("Add points error:", error)
    return NextResponse.json({ error: "添加积分失败" }, { status: 500 })
  }
}
