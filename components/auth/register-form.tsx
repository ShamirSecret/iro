"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { Loader2, UserPlus, Zap, Anchor, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [uplineReferralCode, setUplineReferralCode] = useState("")
  const { registerCrew, registerCaptain, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  // 从URL参数中获取邀请码
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      setUplineReferralCode(code)
    }
  }, [searchParams])

  // 判断注册类型
  const isCaptainRegistration = !uplineReferralCode.trim()
  const isCrewRegistration = uplineReferralCode.trim().length > 0

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setMessage({ text: "请输入有效的以太坊钱包地址。", type: "error" })
      return
    }

    let result
    if (isCaptainRegistration) {
      // 注册船长（需要审核）
      result = await registerCaptain(name, email, walletAddress)
    } else {
      // 注册船员（无需审核）
      result = await registerCrew(name, email, walletAddress, uplineReferralCode)
    }

    if (result.success) {
      setMessage({ text: result.message || "注册成功！", type: "success" })
      setTimeout(() => router.push("/"), 3000)
    } else {
      setMessage({ text: result.message || "注册失败，请检查您的信息。", type: "error" })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-picwe-black p-6">
      <div className="z-10 flex flex-col items-center text-center max-w-md w-full">
        <Link href="/" className="mb-10 flex items-center space-x-3">
          <Zap className="h-8 w-8 text-picwe-yellow" />
          <span className="text-3xl font-bold text-picwe-yellow">PicWe</span>
        </Link>

        <div className="mb-6 p-4 rounded-lg bg-picwe-darkGray border border-gray-700">
          {isCaptainRegistration ? (
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <Anchor className="h-5 w-5" />
              <span className="font-semibold">注册船长</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-cyan-400">
              <Users className="h-5 w-5" />
              <span className="font-semibold">注册船员</span>
            </div>
          )}
          <p className="text-xs text-picwe-lightGrayText mt-2">
            {isCaptainRegistration ? "船长注册需要管理员审核通过后才能使用" : "船员注册通过邀请码验证后即可直接使用"}
          </p>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          {isCaptainRegistration ? "成为经销商船长" : "成为经销商船员"}
        </h1>
        <p className="text-md text-picwe-lightGrayText mb-8">
          {isCaptainRegistration
            ? "填写您的信息申请成为船长，需要等待管理员审核。"
            : "填写您的信息并提供邀请码加入团队。"}
        </p>

        <form onSubmit={handleRegister} className="w-full space-y-5">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="name" className="text-sm font-medium text-picwe-lightGrayText">
              全名
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-picwe-darkGray border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-picwe-yellow focus:border-picwe-yellow"
              placeholder="请输入您的姓名"
            />
          </div>
          <div className="space-y-1.5 text-left">
            <Label htmlFor="email" className="text-sm font-medium text-picwe-lightGrayText">
              邮箱地址
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-picwe-darkGray border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-picwe-yellow focus:border-picwe-yellow"
              placeholder="请输入您的邮箱"
            />
          </div>
          <div className="space-y-1.5 text-left">
            <Label htmlFor="walletAddress" className="text-sm font-medium text-picwe-lightGrayText">
              钱包地址 (用于接收奖励)
            </Label>
            <Input
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              required
              className="bg-picwe-darkGray border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-picwe-yellow focus:border-picwe-yellow"
            />
          </div>
          <div className="space-y-1.5 text-left">
            <Label htmlFor="uplineReferralCode" className="text-sm font-medium text-picwe-lightGrayText">
              邀请码 {isCaptainRegistration && <span className="text-gray-500">(可选，不填则注册船长)</span>}
            </Label>
            <Input
              id="uplineReferralCode"
              value={uplineReferralCode}
              onChange={(e) => setUplineReferralCode(e.target.value)}
              required={isCrewRegistration}
              className="bg-picwe-darkGray border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-picwe-yellow focus:border-picwe-yellow"
              placeholder={isCaptainRegistration ? "留空注册船长，填写则注册船员" : "请输入邀请人的邀请码"}
            />
          </div>

          {message && (
            <p className={`text-sm pt-1 ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-picwe-yellow text-picwe-black text-md font-semibold py-3.5 rounded-xl hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-300/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 flex items-center justify-center shadow-lg shadow-picwe-yellow/30"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isCaptainRegistration ? (
              <Anchor className="mr-2 h-5 w-5" />
            ) : (
              <UserPlus className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "提交中..." : isCaptainRegistration ? "申请成为船长" : "加入团队"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-picwe-lightGrayText">
          已有账户？{" "}
          <Link href="/" className="font-medium text-picwe-yellow hover:underline">
            在此登录
          </Link>
        </p>
      </div>
    </div>
  )
}
