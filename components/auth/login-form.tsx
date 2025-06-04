"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { Loader2, Wallet, Zap } from "lucide-react" // Zap for a modern touch

export default function LoginForm() {
  const { loginWithWallet, isLoading } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await loginWithWallet()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-picwe-black p-6 relative overflow-hidden">
      {/* Subtle background elements for "atmospheric" feel */}
      <div className="absolute inset-0 opacity-5">
        {/* You could add a very subtle, large, blurred SVG pattern or gradient here */}
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-md w-full">
        <Link href="/" className="mb-12 flex items-center space-x-3">
          <Zap className="h-10 w-10 text-picwe-yellow" />
          <span className="text-4xl font-bold text-picwe-yellow">PicWe</span>
        </Link>

        <h1 className="text-4xl font-extrabold text-white mb-4">进入您的专属领域</h1>
        <p className="text-lg text-picwe-lightGrayText mb-10">连接您的 MetaMask 钱包，开启经销商之旅。</p>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <Button
            type="submit"
            className="w-full bg-picwe-yellow text-picwe-black text-lg font-semibold py-4 rounded-xl hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-300/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 flex items-center justify-center shadow-lg shadow-picwe-yellow/30"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Wallet className="mr-3 h-6 w-6" />}
            {isLoading ? "连接中..." : "连接 MetaMask 钱包"}
          </Button>
        </form>

        <p className="mt-10 text-sm text-picwe-lightGrayText">
          还没有账户？{" "}
          <Link href="/register" className="font-medium text-picwe-yellow hover:underline">
            立即注册
          </Link>
        </p>
        <p className="text-xs text-picwe-lightGrayText/70 mt-4">(这是一个模拟流程，您将可以选择一个预设地址进行登录)</p>
      </div>

      {/* Footer/decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-picwe-darkGray/30 to-transparent"></div>
    </div>
  )
}
