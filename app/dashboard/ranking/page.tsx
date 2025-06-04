"use client"

import { useAuth } from "@/app/providers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Trophy, Loader2 } from "lucide-react"

// 安全的数字格式化函数
const safeToLocaleString = (value: number | null | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) return "0"
  return value.toLocaleString()
}

export default function RankingPage() {
  const { allDistributorsData, isLoading: authIsLoading, currentUser } = useAuth()

  // Filter and sort for display on the ranking page (approved distributors, sorted by rank)
  const rankedDisplayList = (allDistributorsData || [])
    .filter((d) => d && d.role === "distributor" && d.status === "approved")
    .sort((a, b) => (a.rank ?? Number.POSITIVE_INFINITY) - (b.rank ?? Number.POSITIVE_INFINITY))

  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-picwe-yellow" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-picwe-yellow">经销商排行榜</h1>
      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            排行榜
          </CardTitle>
          <CardDescription className="text-sm text-picwe-lightGrayText mt-1">
            根据总积分对经销商进行排名。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rankedDisplayList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-700/50">
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider w-[80px]">
                    排名
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    经销商名称
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-right">
                    总积分
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700/50">
                {rankedDisplayList.map((distributor, index) => {
                  if (!distributor || !distributor.id) return null

                  return (
                    <TableRow
                      key={distributor.id}
                      className={`hover:bg-gray-700/30 ${currentUser?.id === distributor.id ? "bg-picwe-yellow/10" : ""}`}
                    >
                      <TableCell className="px-5 py-3 font-semibold text-xl text-picwe-yellow">
                        {distributor.rank === 1 && <Trophy className="inline-block h-5 w-5 mr-1 text-yellow-400" />}
                        {distributor.rank === 2 && <Trophy className="inline-block h-5 w-5 mr-1 text-slate-400" />}
                        {distributor.rank === 3 && <Trophy className="inline-block h-5 w-5 mr-1 text-yellow-700" />}
                        {distributor.rank || "N/A"}
                      </TableCell>
                      <TableCell
                        className={`px-5 py-3 font-medium ${currentUser?.id === distributor.id ? "text-picwe-yellow" : "text-white"}`}
                      >
                        {distributor.name || "未知用户"}
                      </TableCell>
                      <TableCell
                        className={`px-5 py-3 text-right font-semibold ${currentUser?.id === distributor.id ? "text-picwe-yellow" : "text-white"}`}
                      >
                        {safeToLocaleString(distributor.total_points)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-picwe-lightGrayText">排行榜上暂无经销商数据。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
