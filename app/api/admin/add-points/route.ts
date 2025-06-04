"use client"

// API route for admin to manually add points
import { NextResponse } from "next/server"
import { adminAddPoints, getDistributorByWallet } from "@/lib/database" // Assuming admin auth is handled elsewhere or this is a trusted environment

export async function POST(request: Request) {
  try {
    // In a real app, add robust authentication/authorization for this admin endpoint
    // For example, check if the caller is an authenticated admin user
    // const { currentUser } = useAuth(); // This won't work in API route directly
    // if (!currentUser || currentUser.role !== 'admin') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const { targetDistributorWalletAddress, points, pointType } = await request.json()

    if (!targetDistributorWalletAddress || typeof points !== "number" || points <= 0) {
      return NextResponse.json(
        { error: "Invalid parameters: targetDistributorWalletAddress and positive points are required." },
        { status: 400 },
      )
    }
    if (pointType !== "personal" && pointType !== "commission") {
      return NextResponse.json({ error: "Invalid pointType. Must be 'personal' or 'commission'." }, { status: 400 })
    }

    const targetDistributor = await getDistributorByWallet(targetDistributorWalletAddress)
    if (!targetDistributor) {
      return NextResponse.json(
        { error: `Distributor with wallet ${targetDistributorWalletAddress} not found.` },
        { status: 404 },
      )
    }

    const result = await adminAddPoints(targetDistributor.id, points, pointType)

    if (result.success) {
      return NextResponse.json({ message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in admin add-points:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
