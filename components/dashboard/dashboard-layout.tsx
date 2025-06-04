"use client"

import React, { type ReactNode } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Home, Users, BarChart3, LogOut, ShieldAlert, UserCircle, Copy, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast, Toaster } from "sonner"
import { Loader2 } from "lucide-react"

const navItems = [
  { name: "仪表盘", href: "/dashboard", icon: Home },
  { name: "我的团队", href: "/dashboard/downlines", icon: Users },
  { name: "排行榜", href: "/dashboard/ranking", icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-picwe-black">
        <Loader2 className="h-10 w-10 animate-spin text-picwe-yellow" />
      </div>
    )
  }

  // 检查是否是管理员 - 如果是管理员，重定向到管理员页面
  if (currentUser.role === "admin") {
    router.push("/admin/dashboard")
    return (
      <div className="flex items-center justify-center min-h-screen bg-picwe-black">
        <Loader2 className="h-10 w-10 animate-spin text-picwe-yellow" />
        <span className="ml-3 text-white">正在跳转到管理员页面...</span>
      </div>
    )
  }

  // 修复：使用 status 而不是 isApproved，并且排除管理员
  if (currentUser.role !== "admin" && currentUser.status !== "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-picwe-black text-center p-6">
        <ShieldAlert className="h-12 w-12 text-picwe-yellow mb-5" />
        <h1 className="text-2xl font-bold text-white mb-3">申请待审核</h1>
        <p className="text-picwe-lightGrayText mb-7 max-w-sm">
          您的注册申请正在由平台管理员审核。批准后您将收到通知，并可以访问仪表盘。
        </p>
        <div className="text-sm text-picwe-lightGrayText mb-4">
          <p>
            当前状态:{" "}
            <span className="text-picwe-yellow">
              {currentUser.status === "pending" ? "待审核" : currentUser.status === "rejected" ? "已拒绝" : "未知"}
            </span>
          </p>
          <p>
            用户类型: <span className="text-picwe-yellow">{currentUser.roleType === "captain" ? "船长" : "船员"}</span>
          </p>
          <p>
            用户角色: <span className="text-picwe-yellow">{currentUser.role}</span>
          </p>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          className="border-picwe-yellow text-picwe-yellow hover:bg-picwe-yellow hover:text-picwe-black rounded-lg px-6 py-2.5 text-sm font-medium"
        >
          <LogOut className="mr-2 h-4 w-4" /> 登出
        </Button>
      </div>
    )
  }

  const copyReferralCode = () => {
    if (currentUser?.referralCode) {
      navigator.clipboard
        .writeText(currentUser.referralCode)
        .then(() => {
          toast.success("推荐码已复制到剪贴板！")
        })
        .catch((err) => {
          toast.error("复制推荐码失败。")
          console.error("Failed to copy: ", err)
        })
    }
  }

  return (
    <div className="flex min-h-screen bg-picwe-black text-picwe-whiteText">
      <Toaster richColors theme="dark" position="top-right" />
      <aside className="w-60 bg-picwe-darkGray p-5 border-r border-gray-700/50 flex flex-col fixed h-full">
        <Link href="/dashboard" className="flex items-center space-x-2.5 mb-10">
          <Zap className="h-7 w-7 text-picwe-yellow" />
          <span className="text-2xl font-bold text-white">经销商平台</span>
        </Link>
        <nav className="flex-grow space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-colors text-sm font-medium
                ${
                  pathname === item.href
                    ? "bg-picwe-yellow text-picwe-black shadow-md shadow-picwe-yellow/20"
                    : "text-picwe-lightGrayText hover:bg-gray-700/70 hover:text-white"
                }`}
            >
              <item.icon className="mr-3 h-4.5 w-4.5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <p className="text-xs text-picwe-lightGrayText mb-1.5">我的推荐码:</p>
          <div className="flex items-center bg-gray-900/50 p-2 rounded-md">
            <p className="text-xs font-mono text-picwe-yellow flex-grow truncate">{currentUser.referralCode}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyReferralCode}
              className="text-picwe-lightGrayText hover:text-picwe-yellow h-6 w-6 ml-1 shrink-0"
              title="复制推荐码"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col ml-60">
        <header className="bg-picwe-darkGray p-4 border-b border-gray-700/50 flex justify-between items-center sticky top-0 z-30 h-16">
          <div className="text-lg font-semibold text-white">
            {navItems.find((item) => pathname.startsWith(item.href))?.name || "仪表盘"}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 text-picwe-lightGrayText hover:bg-gray-700/70 rounded-lg p-1.5 pr-2.5"
              >
                <Avatar className="h-7 w-7 border-2 border-picwe-yellow">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${currentUser.email}.png?size=32`}
                    alt={currentUser.name}
                  />
                  <AvatarFallback className="bg-picwe-yellow text-picwe-black text-xs">
                    {currentUser.name.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-white">{currentUser.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gray-800 border-gray-700 text-picwe-lightGrayText w-56 rounded-lg shadow-xl"
            >
              <DropdownMenuLabel className="text-white text-sm px-3 py-2">我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700/50" />
              <DropdownMenuItem className="text-sm focus:bg-gray-700/70 focus:text-white cursor-not-allowed px-3 py-2 rounded-md">
                <UserCircle className="mr-2 h-4 w-4" /> 个人资料 (暂未开放)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="text-sm focus:bg-red-700/30 focus:text-red-400 cursor-pointer px-3 py-2 rounded-md"
              >
                <LogOut className="mr-2 h-4 w-4" /> 登出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="p-6 flex-1 overflow-auto bg-picwe-black">{children}</div>
      </main>
    </div>
  )
}
