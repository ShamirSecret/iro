"use client"

import React, { type ReactNode, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth, useLanguage } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Home, Users, BarChart3, LogOut, ShieldAlert, UserCircle, Copy, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast, Toaster } from "sonner"
import { Loader2 } from "lucide-react"
import LanguageSwitcher from "@/components/language-switcher"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth()
  const { t, language } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    {
      name: language === "zh" ? "仪表盘" : "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: language === "zh" ? "我的团队" : "My Team",
      href: "/dashboard/downlines",
      icon: Users,
    },
    {
      name: language === "zh" ? "排行榜" : "Leaderboard",
      href: "/dashboard/ranking",
      icon: BarChart3,
    },
  ]

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
      </div>
    )
  }

  // 检查是否是管理员 - 如果是管理员，重定向到管理员页面
  if (currentUser.role === "admin") {
    router.push("/admin/dashboard")
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
        <span className="ml-3 text-white">
          {language === "zh" ? "正在跳转到管理员页面..." : "Redirecting to admin panel..."}
        </span>
      </div>
    )
  }

  // 修复：使用 status 而不是 isApproved，并且排除管理员
  if (currentUser.status !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-center p-6">
        <ShieldAlert className="h-12 w-12 text-yellow-500 mb-5" />
        <h1 className="text-2xl font-bold text-white mb-3">
          {language === "zh" ? "申请待审核" : "Application Under Review"}
        </h1>
        <p className="text-gray-400 mb-7 max-w-sm">
          {language === "zh"
            ? "您的注册申请正在由平台管理员审核。批准后您将收到通知，并可以访问仪表盘。"
            : "Your registration application is being reviewed by platform administrators. You will be notified once approved and can access the dashboard."}
        </p>
        <div className="text-sm text-gray-400 mb-4">
          <p>
            {language === "zh" ? "当前状态: " : "Current Status: "}
            <span className="text-yellow-500">
              {currentUser.status === "pending"
                ? language === "zh"
                  ? "待审核"
                  : "Pending"
                : currentUser.status === "rejected"
                  ? language === "zh"
                    ? "已拒绝"
                    : "Rejected"
                  : language === "zh"
                    ? "未知"
                    : "Unknown"}
            </span>
          </p>
          <p>
            {language === "zh" ? "用户类型: " : "User Type: "}
            <span className="text-yellow-500">
              {currentUser.roleType === "captain"
                ? language === "zh"
                  ? "船长"
                  : "Captain"
                : language === "zh"
                  ? "船员"
                  : "Crew"}
            </span>
          </p>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg px-6 py-2.5 text-sm font-medium"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {language === "zh" ? "登出" : "Logout"}
        </Button>
      </div>
    )
  }

  const copyReferralCode = () => {
    if (currentUser?.referralCode) {
      navigator.clipboard
        .writeText(currentUser.referralCode)
        .then(() => {
          toast.success(language === "zh" ? "推荐码已复制到剪贴板！" : "Referral code copied to clipboard!")
        })
        .catch((err) => {
          toast.error(language === "zh" ? "复制推荐码失败。" : "Failed to copy referral code.")
          console.error("Failed to copy: ", err)
        })
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white overflow-hidden">
      <Toaster richColors theme="dark" position="top-right" />

      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} md:hidden`} onClick={() => setSidebarOpen(false)} />
      {/* Mobile sidebar drawer */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-gray-800 p-5 border-r border-gray-700 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 md:hidden`}>
        <Link href="/dashboard" className="flex items-center space-x-2.5 mb-10">
          <img src="/logo.jpg" alt="picwe Logo" className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold text-white">{language === "zh" ? "航海平台" : "picwe"}</span>
        </Link>
        <nav className="flex-grow space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-colors text-sm font-medium
                ${
                  pathname === item.href
                    ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
            >
              <item.icon className="mr-3 h-4.5 w-4.5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Sidebar (hidden on small screens) */}
      <aside className="hidden md:flex w-60 bg-gray-800 p-5 border-r border-gray-700 flex-col fixed h-full z-10">
        <Link href="/dashboard" className="flex items-center space-x-2.5 mb-10">
          <img src="/logo.jpg" alt="picwe Logo" className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold text-white">{language === "zh" ? "航海平台" : "picwe"}</span>
        </Link>

        <nav className="flex-grow space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-colors text-sm font-medium
                ${
                  pathname === item.href
                    ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
            >
              <item.icon className="mr-3 h-4.5 w-4.5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-1.5">{language === "zh" ? "我的推荐码:" : "My Referral Code:"}</p>
          <div className="flex items-center bg-gray-900 p-2 rounded-md">
            <p className="text-xs font-mono text-yellow-500 flex-grow truncate">{currentUser.referralCode}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyReferralCode}
              className="text-gray-400 hover:text-yellow-500 h-6 w-6 ml-1 shrink-0"
              title={language === "zh" ? "复制推荐码" : "Copy referral code"}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-60 ml-0">
        {/* Header */}
        <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 z-20 h-16">
          {/* Mobile menu button */}
          <Menu className="h-6 w-6 text-white md:hidden cursor-pointer mr-4" onClick={() => setSidebarOpen(true)} />
          <div className="text-lg font-semibold text-white">
            {navItems.find((item) => pathname.startsWith(item.href))?.name ||
              (language === "zh" ? "仪表盘" : "Dashboard")}
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 text-gray-300 hover:bg-gray-700 rounded-lg p-1.5 pr-2.5 cursor-pointer">
                  <Avatar className="h-7 w-7 border-2 border-yellow-500">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${currentUser.email}.png?size=32`}
                      alt={currentUser.name}
                    />
                    <AvatarFallback className="bg-yellow-500 text-black text-xs">
                      {currentUser.name.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white">{currentUser.name}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-800 border-gray-700 text-gray-300 w-56 rounded-lg shadow-xl"
              >
                <DropdownMenuItem
                  onClick={logout}
                  className="text-sm focus:bg-red-700/30 focus:text-red-400 cursor-pointer px-3 py-2 rounded-md"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === "zh" ? "登出" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-900 p-6">{children}</div>
      </main>
    </div>
  )
}
