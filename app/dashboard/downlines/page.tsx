"use client"

import { useAuth, useLanguage } from "@/app/providers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, ArrowDownCircle, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

// 安全的数字格式化函数
const safeToLocaleString = (value: number | null | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) return "0"
  return value.toLocaleString()
}

export default function DownlinesPage() {
  const { currentUser, getDownlineDetails, isLoading: authLoading, allDistributorsData } = useAuth()
  const { language } = useLanguage()
  const [downlines, setDownlines] = useState<any[]>([])

  useEffect(() => {
    if (currentUser && currentUser.id) {
      const details = getDownlineDetails(currentUser.id)
      setDownlines(details || [])
    }
  }, [currentUser, getDownlineDetails, allDistributorsData])

  if (authLoading || !currentUser) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-400">{language === "zh" ? "加载中..." : "Loading..."}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">{language === "zh" ? "我的船队" : "My Fleet"}</h1>
      <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700">
        <CardHeader className="p-5 border-b border-gray-700">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Users className="mr-2.5 h-5 w-5 text-yellow-500" />
            {language === "zh" ? `直接下级船员 (${downlines.length})` : `Direct Team Members (${downlines.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {downlines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-700">
                  <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {language === "zh" ? "名称" : "Name"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {language === "zh" ? "头衔" : "Title"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {language === "zh" ? "总积分" : "Total Points"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {language === "zh" ? "直接积分" : "Personal Points"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {language === "zh" ? "佣金积分" : "Commission Points"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">
                    {language === "zh" ? "下级数量" : "Team Size"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700">
                {downlines.map((d) => {
                  if (!d || !d.id) return null

                  return (
                    <TableRow key={d.id} className="hover:bg-gray-700/30">
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {d.name || (language === "zh" ? "未知船员" : "Unknown Member")}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        <span className={`inline-flex items-center ${
                          d.teamSize > 0 ? "text-blue-400" : "text-gray-400"
                        }`}>
                          {d.teamSize > 0 
                            ? (language === "zh" ? "船长" : "Captain")
                            : (language === "zh" ? "船员" : "Crew")
                          }
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-yellow-500 font-semibold whitespace-nowrap">
                        {safeToLocaleString(d.totalPoints)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {safeToLocaleString(d.personalPoints)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {safeToLocaleString(d.commissionPoints)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap text-center">
                        {d.teamSize ?? 0}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ArrowDownCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {language === "zh" ? "您目前还没有直接下级船员。" : "You don't have any direct team members yet."}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === "zh" ? "分享您的邀请码以发展船队！" : "Share your referral code to build your team!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {currentUser.uplineDistributorId && (
        <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700 mt-6">
          <CardHeader className="p-5">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <TrendingUp className="mr-2.5 h-5 w-5 text-yellow-500" />
              {language === "zh" ? "我的上级船长" : "My Upline Captain"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {(() => {
              const upline = allDistributorsData.find((d) => d && d.id === currentUser.uplineDistributorId)
              return upline ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">
                    {language === "zh" ? "名称: " : "Name: "}
                    <span className="text-white font-medium">
                      {upline.name || (language === "zh" ? "未知" : "Unknown")}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">
                    {language === "zh" ? "头衔: " : "Title: "}
                    <span className="text-white font-medium">
                      {upline.teamSize > 0 
                        ? (language === "zh" ? "船长" : "Captain")
                        : (language === "zh" ? "船员" : "Crew")
                      }
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">
                    {language === "zh" ? "联系邮箱: " : "Contact Email: "}
                    <span className="text-white font-medium">
                      {upline.email || (language === "zh" ? "未设置" : "Not set")}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">
                  {language === "zh" ? "上级船长信息未找到。" : "Upline captain information not found."}
                </p>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
