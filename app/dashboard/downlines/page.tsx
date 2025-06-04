"use client"

import { useAuth } from "@/app/providers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, ArrowDownCircle, TrendingUp, PlusCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// 安全的数字格式化函数
const safeToLocaleString = (value: number | null | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) return "0"
  return value.toLocaleString()
}

export default function DownlinesPage() {
  const {
    currentUser,
    getDownlineDetails,
    addPointsToDistributor,
    isLoading: authLoading,
    allDistributorsData,
  } = useAuth()
  const [downlines, setDownlines] = useState<any[]>([])
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({}) // For point input fields

  const handleAddPoints = (distributorId: string) => {
    const pointsToAdd = Number.parseInt(pointInputs[distributorId] || "0", 10)
    if (pointsToAdd > 0) {
      // 找到下级的钱包地址
      const distributor = allDistributorsData.find((d) => d.id === distributorId)
      if (distributor && distributor.id) {
        addPointsToDistributor(distributor.id, pointsToAdd, true)
      } else {
        alert("未找到该下级的信息，无法加分。")
        return
      }
      setPointInputs((prev) => ({ ...prev, [distributorId]: "" })) // Clear input
      // Data will re-render via useEffect listening to allDistributorsData
    } else {
      alert("请输入有效的积分数量。")
    }
  }

  const handlePointInputChange = (distributorId: string, value: string) => {
    setPointInputs((prev) => ({ ...prev, [distributorId]: value }))
  }

  useEffect(() => {
    if (currentUser && currentUser.id) {
      const details = getDownlineDetails(currentUser.id)
      setDownlines(details || [])
    }
  }, [currentUser, getDownlineDetails, allDistributorsData]) // Listen to allDistributorsData for re-renders on point changes

  // Re-fetch downline details if currentUser or allDistributorsData changed, ensuring UI updates
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const freshDownlines = getDownlineDetails(currentUser.id)
      // Check if downlines actually changed to prevent infinite loops if getDownlineDetails isn't memoized correctly
      if (JSON.stringify(freshDownlines) !== JSON.stringify(downlines)) {
        setDownlines(freshDownlines || [])
      }
    }
  }, [currentUser, allDistributorsData, getDownlineDetails, downlines])

  if (authLoading || !currentUser) {
    return <div className="text-center p-10">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">我的船队</h1>
      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Users className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            直接下级船员 ({downlines.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {downlines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-700/50">
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    名称
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    类型
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    总积分
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    直接积分
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    佣金积分
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-center">
                    下级数量
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700/50">
                {downlines.map((d) => {
                  if (!d || !d.id) return null

                  return (
                    <TableRow key={d.id} className="hover:bg-gray-700/30">
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {d.name || "未知船员"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-picwe-lightGrayText whitespace-nowrap">
                        {d.role_type === "captain" ? "船长" : d.role_type === "crew" ? "船员" : "未知"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-picwe-yellow font-semibold whitespace-nowrap">
                        {safeToLocaleString(d.total_points)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {safeToLocaleString(d.personal_points)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {safeToLocaleString(d.commission_points)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap text-center">
                        {(d.downline_distributor_ids && d.downline_distributor_ids.length) || 0}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ArrowDownCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-picwe-lightGrayText">您目前还没有直接下级船员。</p>
              <p className="text-xs text-gray-500 mt-1">分享您的邀请码以发展船队！</p>
            </div>
          )}
        </CardContent>
      </Card>

      {currentUser.uplineDistributorId && (
        <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50 mt-6">
          <CardHeader className="p-5">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <TrendingUp className="mr-2.5 h-5 w-5 text-picwe-yellow" />
              我的上级船长
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {(() => {
              const upline = allDistributorsData.find((d) => d && d.id === currentUser.uplineDistributorId)
              return upline ? (
                <div className="space-y-1">
                  <p className="text-sm text-picwe-lightGrayText">
                    名称: <span className="text-white font-medium">{upline.name || "未知"}</span>
                  </p>
                  <p className="text-sm text-picwe-lightGrayText">
                    类型: {" "}
                    <span className="text-white font-medium">
                      {upline.roleType === "captain" ? "船长" : upline.roleType === "crew" ? "船员" : "未知"}
                    </span>
                  </p>
                  <p className="text-sm text-picwe-lightGrayText">
                    联系邮箱: <span className="text-white font-medium">{upline.email || "未设置"}</span>
                  </p>
                </div>
              ) : (
                <p className="text-picwe-lightGrayText">上级船长信息未找到。</p>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
