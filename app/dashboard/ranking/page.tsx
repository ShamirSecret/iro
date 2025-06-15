"use client"

import { useAuth, useLanguage } from "@/app/providers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Trophy, Loader2 } from "lucide-react"
import { useState } from "react"

// 安全的数字格式化函数
const safeToLocaleString = (value: number | null | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) return "0"
  return value.toLocaleString()
}

export default function RankingPage() {
  const { allDistributorsData, isLoading: authIsLoading, currentUser } = useAuth()
  const { language } = useLanguage()
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Filter and sort for display on the ranking page (approved distributors, sorted by rank)
  const rankedDisplayList = (allDistributorsData || [])
    .filter((d) => d && d.role === "distributor" && d.status === "approved")
    .sort((a, b) => (a.rank ?? Number.POSITIVE_INFINITY) - (b.rank ?? Number.POSITIVE_INFINITY))
  const totalPages = Math.ceil(rankedDisplayList.length / pageSize)
  const paginatedList = rankedDisplayList.slice((page - 1) * pageSize, page * pageSize)

  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-yellow-500">{language === "zh" ? "船员排行榜" : "Member Leaderboard"}</h1>
      <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700">
        <CardHeader className="p-5 border-b border-gray-700">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="mr-2.5 h-5 w-5 text-yellow-500" />
            {language === "zh" ? "排行榜" : "Leaderboard"}
          </CardTitle>
          <CardDescription className="text-sm text-gray-400 mt-1">
            {language === "zh" ? "根据总积分对船员进行排名。" : "Members ranked by total points."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rankedDisplayList.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-gray-700">
                    <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-[80px]">
                      {language === "zh" ? "排名" : "Rank"}
                    </TableHead>
                    <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {language === "zh" ? "船员名称" : "Member Name"}
                    </TableHead>
                    <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                      {language === "zh" ? "总积分" : "Total Points"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-700">
                  {paginatedList.map((distributor, index) => {
                    if (!distributor || !distributor.id) return null

                    return (
                      <TableRow
                        key={distributor.id}
                        className={`hover:bg-gray-700/30 ${currentUser?.id === distributor.id ? "bg-yellow-500/10" : ""}`}
                      >
                        <TableCell className="px-5 py-3 font-semibold text-xl text-yellow-500">
                          {distributor.rank === 1 && <Trophy className="inline-block h-5 w-5 mr-1 text-yellow-400" />}
                          {distributor.rank === 2 && <Trophy className="inline-block h-5 w-5 mr-1 text-slate-400" />}
                          {distributor.rank === 3 && <Trophy className="inline-block h-5 w-5 mr-1 text-yellow-700" />}
                          {distributor.rank || "N/A"}
                        </TableCell>
                        <TableCell
                          className={`px-5 py-3 font-medium ${currentUser?.id === distributor.id ? "text-yellow-500" : "text-white"}`}
                        >
                          {distributor.name || (language === "zh" ? "未知用户" : "Unknown User")}
                        </TableCell>
                        <TableCell
                          className={`px-5 py-3 text-right font-semibold ${currentUser?.id === distributor.id ? "text-yellow-500" : "text-white"}`}
                        >
                          {safeToLocaleString(distributor.totalPoints)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-center items-center p-4 bg-gray-800 space-x-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 text-white"
                >
                  {language === "zh" ? "上一页" : "Prev"}
                </button>
                <span className="text-sm text-gray-400">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 text-white"
                >
                  {language === "zh" ? "下一页" : "Next"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {language === "zh" ? "排行榜上暂无船员数据。" : "No member data available on the leaderboard."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
