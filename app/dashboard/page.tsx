"use client"

import type React from "react"

import { useAuth } from "@/app/providers"
import { Award, Users, Gift, Copy, BarChartHorizontal, Wallet, Mail, LinkIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { useState, useEffect } from "react"

// 安全的数字格式化函数
const safeToLocaleString = (value: number | null | undefined): string => {
  if (typeof value !== "number" || isNaN(value)) return "0"
  return value.toLocaleString()
}

// 安全的字符串截取函数
const safeSubstring = (str: string | null | undefined, start: number, end?: number): string => {
  if (!str || typeof str !== "string") return ""
  return end !== undefined ? str.substring(start, end) : str.substring(start)
}

// 安全的钱包地址格式化
const formatWalletAddress = (address: string | null | undefined): string => {
  if (!address || typeof address !== "string" || address.length < 10) {
    return "无效地址"
  }
  return `${safeSubstring(address, 0, 6)}...${safeSubstring(address, address.length - 4)}`
}

export default function DashboardPage() {
  const { currentUser, getDownlineDetails } = useAuth()
  const [downlineMembers, setDownlineMembers] = useState<any[]>([])
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    if (currentUser && currentUser.id) {
      // 获取下级成员
      const members = getDownlineDetails(currentUser.id)
      setDownlineMembers(members || [])

      // 生成邀请链接
      const baseUrl = "https://sailing.picwe.org"
      const referralCode = currentUser.referralCode || ""
      setInviteLink(`${baseUrl}/register?code=${referralCode}`)
    }
  }, [currentUser, getDownlineDetails])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-picwe-lightGrayText">加载用户信息中...</p>
        </div>
      </div>
    )
  }

  const copyReferralCode = () => {
    const referralCode = currentUser?.referralCode
    if (referralCode) {
      navigator.clipboard
        .writeText(referralCode)
        .then(() => {
          toast.success("推荐码已复制到剪贴板！")
        })
        .catch((err) => {
          toast.error("复制推荐码失败。")
          console.error("Failed to copy: ", err)
        })
    } else {
      toast.error("推荐码不可用")
    }
  }

  const copyInviteLink = () => {
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        toast.success("邀请链接已复制到剪贴板！")
      })
      .catch((err) => {
        toast.error("复制邀请链接失败。")
        console.error("Failed to copy: ", err)
      })
  }

  // Simplified Stat Card component for this page
  const InfoCard = ({
    title,
    value,
    icon: Icon,
    yellowValue = false,
  }: { title: string; value: string | number; icon: React.ElementType; yellowValue?: boolean }) => (
    <div className="bg-picwe-darkGray p-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-picwe-lightGrayText">{title}</p>
        <Icon className="h-4 w-4 text-picwe-yellow" />
      </div>
      <p className={`text-xl font-bold ${yellowValue ? "text-picwe-yellow" : "text-white"}`}>{value}</p>
    </div>
  )

  // 安全获取用户数据
  const userName = currentUser.name || "用户"
  const userLevel = Math.floor((currentUser.totalPoints || 0) / 1000) + 1
  const userPoints = currentUser.totalPoints || 0
  const userWallet = currentUser.walletAddress || ""
  const userEmail = currentUser.email || ""
  const userRank = currentUser.rank || null
  const referralCode = currentUser.referralCode || ""

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">欢迎回来, {userName}!</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info & Referral Code */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
            <CardHeader className="border-b border-gray-700/50 p-4">
              <CardTitle className="text-md font-semibold text-white flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-picwe-yellow" /> 钱包信息
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-picwe-lightGrayText">积分:</span>
                <span className="text-lg font-bold text-picwe-yellow">{safeToLocaleString(userPoints)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-picwe-lightGrayText">钱包:</span>
                <span className="text-xs font-mono text-white truncate" title={userWallet}>
                  {formatWalletAddress(userWallet)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
            <CardHeader className="border-b border-gray-700/50 p-4">
              <CardTitle className="text-md font-semibold text-white flex items-center">
                <Mail className="h-5 w-5 mr-2 text-picwe-yellow" /> 联系方式
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-picwe-lightGrayText">邮箱:</span>
                <span className="text-sm text-white truncate" title={userEmail}>
                  {userEmail || "未设置"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
            <CardHeader className="border-b border-gray-700/50 p-4">
              <CardTitle className="text-md font-semibold text-white flex items-center">
                <Gift className="h-5 w-5 mr-2 text-picwe-yellow" /> 我的推荐码
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center bg-picwe-black p-2.5 rounded-lg">
                <p className="text-lg font-mono text-picwe-yellow flex-grow truncate">{referralCode || "暂无推荐码"}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyReferralCode}
                  className="text-picwe-lightGrayText hover:text-picwe-yellow h-7 w-7 ml-2 shrink-0"
                  title="复制推荐码"
                  disabled={!referralCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <p className="text-xs text-picwe-lightGrayText mb-2">邀请链接:</p>
                <div className="flex items-center bg-picwe-black p-2.5 rounded-lg">
                  <p className="text-xs font-mono text-picwe-yellow flex-grow truncate">{inviteLink || "生成中..."}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyInviteLink}
                    className="text-picwe-lightGrayText hover:text-picwe-yellow h-7 w-7 ml-2 shrink-0"
                    title="复制邀请链接"
                    disabled={!inviteLink}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InfoCard title="我的排名" value={userRank ? `#${userRank}` : "N/A"} icon={Award} />
            <InfoCard title="团队成员" value={downlineMembers.length || 0} icon={Users} />
            <InfoCard title="总积分" value={safeToLocaleString(userPoints)} icon={BarChartHorizontal} yellowValue />
          </div>

          <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
            <CardHeader className="border-b border-gray-700/50 p-4">
              <CardTitle className="text-md font-semibold text-white">我的团队成员</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {downlineMembers && downlineMembers.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {downlineMembers.slice(0, 5).map((member) => {
                    if (!member || !member.id) return null

                    return (
                      <li key={member.id} className="bg-picwe-black p-3 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white truncate" title={member.name || "未知用户"}>
                            {member.name || "未知用户"}
                          </span>
                          <span className="text-sm font-semibold text-picwe-yellow">
                            {safeToLocaleString(member.totalPoints)} 积分
                          </span>
                        </div>
                        <div className="text-xs text-picwe-lightGrayText mt-0.5">
                          类型:{" "}
                          {member.roleType === "captain" ? "船长" : member.roleType === "crew" ? "船员" : "未知"}
                        </div>
                      </li>
                    )
                  })}
                  {downlineMembers.length > 5 && (
                    <li className="text-center pt-2">
                      <Link href="/dashboard/downlines" className="text-sm text-picwe-yellow hover:underline">
                        查看全部 {downlineMembers.length} 个团队成员
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-picwe-lightGrayText mx-auto mb-3" />
                  <p className="text-picwe-lightGrayText">暂无团队成员。</p>
                  <p className="text-xs text-gray-500 mt-1">分享您的邀请链接以发展您的团队！</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
