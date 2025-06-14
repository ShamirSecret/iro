"use client"

import type React from "react"
import { useAuth, useLanguage } from "@/app/providers"
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
    return "Invalid address"
  }
  return `${safeSubstring(address, 0, 6)}...${safeSubstring(address, address.length - 4)}`
}

export default function DashboardPage() {
  const { currentUser, getDownlineDetails } = useAuth()
  const { language } = useLanguage()
  const [downlineMembers, setDownlineMembers] = useState<any[]>([])
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    if (currentUser && currentUser.id) {
      // 获取下级成员
      const members = getDownlineDetails(currentUser.id)
      setDownlineMembers(members || [])

      // 生成邀请链接
      const baseUrl = "https://picwe-invest.vercel.app"
      const referralCode = currentUser.referralCode || ""
      setInviteLink(`${baseUrl}/register?code=${referralCode}`)
    }
  }, [currentUser, getDownlineDetails])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-400">{language === "zh" ? "加载用户信息中..." : "Loading user information..."}</p>
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
          toast.success(language === "zh" ? "推荐码已复制到剪贴板！" : "Referral code copied to clipboard!")
        })
        .catch((err) => {
          toast.error(language === "zh" ? "复制推荐码失败。" : "Failed to copy referral code.")
          console.error("Failed to copy: ", err)
        })
    } else {
      toast.error(language === "zh" ? "推荐码不可用" : "Referral code not available")
    }
  }

  const copyInviteLink = () => {
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        toast.success(language === "zh" ? "邀请链接已复制到剪贴板！" : "Invite link copied to clipboard!")
      })
      .catch((err) => {
        toast.error(language === "zh" ? "复制邀请链接失败。" : "Failed to copy invite link.")
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
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">{title}</p>
        <Icon className="h-4 w-4 text-yellow-500" />
      </div>
      <p className={`text-xl font-bold ${yellowValue ? "text-yellow-500" : "text-white"}`}>{value}</p>
    </div>
  )

  // 安全获取用户数据
  const userName = currentUser.name || (language === "zh" ? "用户" : "User")
  const userLevel = Math.floor((currentUser.totalPoints || 0) / 1000) + 1
  const userPoints = currentUser.totalPoints || 0
  const userWallet = currentUser.walletAddress || ""
  const userEmail = currentUser.email || ""
  const userRank = currentUser.rank || null
  const referralCode = currentUser.referralCode || ""

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        {language === "zh" ? `欢迎回来, ${userName}!` : `Welcome back, ${userName}!`}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info & Referral Code */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700">
            <CardHeader className="border-b border-gray-700 p-4">
              <CardTitle className="text-md font-semibold text-white flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-yellow-500" />
                {language === "zh" ? "钱包信息" : "Wallet Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-400">{language === "zh" ? "积分:" : "Points:"}</span>
                <span className="text-lg font-bold text-yellow-500">{safeToLocaleString(userPoints)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-400">{language === "zh" ? "钱包:" : "Wallet:"}</span>
                <span className="text-xs font-mono text-white truncate" title={userWallet}>
                  {formatWalletAddress(userWallet)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700">
            <CardHeader className="border-b border-gray-700 p-4">
              <CardTitle className="text-md font-semibold text-white flex items-center">
                <Mail className="h-5 w-5 mr-2 text-yellow-500" />
                {language === "zh" ? "联系方式" : "Contact Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-400">{language === "zh" ? "邮箱:" : "Email:"}</span>
                <span className="text-sm text-white truncate" title={userEmail}>
                  {userEmail || (language === "zh" ? "未设置" : "Not set")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700">
            <CardHeader className="border-b border-gray-700 p-4">
              <CardTitle className="text-md font-semibold text-white flex items-center">
                <Gift className="h-5 w-5 mr-2 text-yellow-500" />
                {language === "zh" ? "我的推荐码" : "My Referral Code"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center bg-gray-900 p-2.5 rounded-lg">
                <p className="text-lg font-mono text-yellow-500 flex-grow truncate">
                  {referralCode || (language === "zh" ? "暂无推荐码" : "No referral code")}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyReferralCode}
                  className="text-gray-400 hover:text-yellow-500 h-7 w-7 ml-2 shrink-0"
                  title={language === "zh" ? "复制推荐码" : "Copy referral code"}
                  disabled={!referralCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">{language === "zh" ? "邀请链接:" : "Invite Link:"}</p>
                <div className="flex items-center bg-gray-900 p-2.5 rounded-lg">
                  <p className="text-xs font-mono text-yellow-500 flex-grow truncate">
                    {inviteLink || (language === "zh" ? "生成中..." : "Generating...")}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyInviteLink}
                    className="text-gray-400 hover:text-yellow-500 h-7 w-7 ml-2 shrink-0"
                    title={language === "zh" ? "复制邀请链接" : "Copy invite link"}
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
            <InfoCard
              title={language === "zh" ? "我的排名" : "My Rank"}
              value={userRank ? `#${userRank}` : "N/A"}
              icon={Award}
            />
            <InfoCard
              title={language === "zh" ? "团队成员" : "Team Members"}
              value={downlineMembers.length || 0}
              icon={Users}
            />
            <InfoCard
              title={language === "zh" ? "总积分" : "Total Points"}
              value={safeToLocaleString(userPoints)}
              icon={BarChartHorizontal}
              yellowValue
            />
          </div>

          <Card className="bg-gray-800 rounded-xl shadow-xl border-gray-700">
            <CardHeader className="border-b border-gray-700 p-4">
              <CardTitle className="text-md font-semibold text-white">
                {language === "zh" ? "我的团队成员" : "My Team Members"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {downlineMembers && downlineMembers.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {downlineMembers.slice(0, 5).map((member) => {
                    if (!member || !member.id) return null

                    return (
                      <li key={member.id} className="bg-gray-900 p-3 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                          <span
                            className="text-sm font-medium text-white truncate"
                            title={member.name || (language === "zh" ? "未知用户" : "Unknown user")}
                          >
                            {member.name || (language === "zh" ? "未知用户" : "Unknown user")}
                          </span>
                          <span className="text-sm font-semibold text-yellow-500">
                            {safeToLocaleString(member.totalPoints)} {language === "zh" ? "积分" : "points"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {language === "zh" ? "类型: " : "Type: "}
                          {member.roleType === "captain"
                            ? language === "zh"
                              ? "船长"
                              : "Captain"
                            : member.roleType === "crew"
                              ? language === "zh"
                                ? "船员"
                                : "Crew"
                              : language === "zh"
                                ? "未知"
                                : "Unknown"}
                        </div>
                      </li>
                    )
                  })}
                  {downlineMembers.length > 5 && (
                    <li className="text-center pt-2">
                      <Link href="/dashboard/downlines" className="text-sm text-yellow-500 hover:underline">
                        {language === "zh"
                          ? `查看全部 ${downlineMembers.length} 个团队成员`
                          : `View all ${downlineMembers.length} team members`}
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">{language === "zh" ? "暂无团队成员。" : "No team members yet."}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "zh"
                      ? "分享您的邀请链接以发展您的团队！"
                      : "Share your invite link to grow your team!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
