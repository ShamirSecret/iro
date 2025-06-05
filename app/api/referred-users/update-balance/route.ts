import { NextResponse } from "next/server"
import { updateReferredUserWusdBalance } from "@/lib/database"

// 可选安全校验：外部调用时在请求头中带上 Authorization: Bearer ${process.env.BALANCE_UPDATE_SECRET}
const BALANCE_UPDATE_SECRET = process.env.BALANCE_UPDATE_SECRET

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (BALANCE_UPDATE_SECRET && authHeader !== `Bearer ${BALANCE_UPDATE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json();
    // 批量处理逻辑：如果 body 是数组，则批量处理
    if (Array.isArray(body)) {
      // 批量更新
      const results = await Promise.all(body.map(async (item) => {
        const referredCustomerAddress = item.referredCustomerAddress;
        let newWusdBalance = item.newWusdBalance;
        if (typeof newWusdBalance === "string") {
          newWusdBalance = parseFloat(newWusdBalance);
        }
        if (!referredCustomerAddress || typeof newWusdBalance !== "number" || isNaN(newWusdBalance)) {
          return { referredCustomerAddress, success: false, message: "参数不完整或类型错误" };
        }
        const result = await updateReferredUserWusdBalance(
          referredCustomerAddress,
          newWusdBalance
        );
        return { referredCustomerAddress, ...result };
      }));
      return NextResponse.json({ results });
    }
    // 单个处理逻辑
    const referredCustomerAddress = body.referredCustomerAddress;
    let newWusdBalance = body.newWusdBalance;
    if (typeof newWusdBalance === "string") {
      newWusdBalance = parseFloat(newWusdBalance);
    }
    if (!referredCustomerAddress || typeof newWusdBalance !== "number" || isNaN(newWusdBalance)) {
      return NextResponse.json({ error: "参数不完整或类型错误：需要 referredCustomerAddress 和数值类型的 newWusdBalance" }, { status: 400 })
    }

    const result = await updateReferredUserWusdBalance(
      referredCustomerAddress,
      newWusdBalance
    )

    if (result.success) {
      return NextResponse.json({ message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("更新 WUSD 余额时出错：", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 