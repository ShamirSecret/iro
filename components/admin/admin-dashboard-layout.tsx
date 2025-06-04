"use client"

import React, { type ReactNode } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, UserCheck, LogOut, ShieldCheck, Search, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"

const adminNavItems = [
  { name: "管理概览", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "经销商审核", href: "/admin/dashboard/registrations", icon: UserCheck },
  { name: "经销商查询", href: "/admin/dashboard/search", icon: Search },
  { name: "管理员管理", href: "/admin/dashboard/admins", icon: Users },
]

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || currentUser?.role !== "admin")) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, currentUser, router])

  if (isLoading || !isAuthenticated || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-picwe-black">
        <Loader2 className="h-12 w-12 animate-spin text-picwe-yellow" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-picwe-black text-picwe-whiteText">
      <aside className="w-60 bg-picwe-darkGray p-5 border-r border-gray-700/50 flex flex-col fixed h-full">
        <Link href="/admin/dashboard" className="flex items-center space-x-2.5 mb-10">
          <ShieldCheck className="h-7 w-7 text-picwe-yellow" />
          <span className="text-2xl font-bold text-white">管理后台</span>
        </Link>
        <nav className="flex-grow space-y-1.5">
          {adminNavItems.map((item) => (
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
      </aside>
      <main className="flex-1 flex flex-col ml-60">
        {" "}
        {/* Add ml-60 for fixed sidebar */}
        <header className="bg-picwe-darkGray p-4 border-b border-gray-700/50 flex justify-between items-center sticky top-0 z-30 h-16">
          <div className="text-lg font-semibold text-white">
            {adminNavItems.find((item) => pathname.startsWith(item.href))?.name || "管理仪表盘"}
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
              <DropdownMenuLabel className="text-white text-sm px-3 py-2">管理员账户</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700/50" />
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
