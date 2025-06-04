"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { Loader2, UserPlus, Zap, Anchor, Users, Wallet } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
  }
}

export default function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [uplineReferralCode, setUplineReferralCode] = useState("")
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
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

  // 检查是否安装了 MetaMask
  const checkIfMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum && window.ethereum.isMetaMask
  }

  useEffect(() => {
    if (!checkIfMetaMaskInstalled() || !window.ethereum) {
      return
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask accounts changed (register form):", accounts)
      if (accounts.length === 0) {
        setWalletError("MetaMask未连接或已锁定。请在MetaMask中选择一个账户。")
        setWalletAddress("")
      } else {
        const newAddress = accounts[0]
        if (walletAddress !== newAddress) {
          // Only update if the address actually changed
          setWalletAddress(newAddress)
          setWalletError(null)
        }
      }
    }

    // Attempt to get current accounts on mount
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err) => console.error("Error fetching initial accounts (register):", err))

    window.ethereum.on("accountsChanged", handleAccountsChanged)

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [walletAddress])

  // 连接 MetaMask 获取地址
  const connectMetaMask = async () => {
    setWalletError(null)
    setIsConnectingWallet(true)

    try {
      if (!checkIfMetaMaskInstalled()) {
        throw new Error("请安装 MetaMask 钱包。您可以从 https://metamask.io 下载。")
      }

      if (!window.ethereum) {
        throw new Error("未检测到 MetaMask，请确保已安装并启用。")
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("未能获取钱包地址，请确保 MetaMask 已解锁并授权连接。")
      }

      const address = accounts[0]
      setWalletAddress(address)
      setWalletError(null)
    } catch (error: any) {
      console.error("连接 MetaMask 错误:", error)
      let errorMessage = "连接钱包失败，请重试。"

      if (error.code === 4001) {
        errorMessage = "用户拒绝了连接请求。"
      } else if (error.code === -32002) {
        errorMessage = "MetaMask 连接请求已在处理中，请检查 MetaMask 弹窗。"
      } else if (error.message) {
        errorMessage = error.message
      }

      setWalletError(errorMessage)
    } finally {
      setIsConnectingWallet(false)
    }
  }

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
            <div className="flex space-x-2">
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x... 或点击右侧按钮连接 MetaMask"
                required
                className="bg-picwe-darkGray border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-picwe-yellow focus:border-picwe-yellow flex-1"
              />
              <Button
                type="button"
                onClick={connectMetaMask}
                disabled={isConnectingWallet}
                className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 rounded-lg px-4 py-3 flex items-center justify-center min-w-[120px]"
                title="连接 MetaMask 获取地址"
              >
                {isConnectingWallet ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-1" />
                    <span className="text-sm">连接</span>
                  </>
                )}
              </Button>
            </div>
            {walletError && <p className="text-red-400 text-xs mt-1">{walletError}</p>}
            {walletAddress && (
              <p className="text-green-400 text-xs mt-1">
                ✓ 已获取钱包地址: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </p>
            )}
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
            <div
              className={`p-3 rounded-lg border ${
                message.type === "success"
                  ? "bg-green-900/20 border-green-500/50 text-green-400"
                  : "bg-red-900/20 border-red-500/50 text-red-400"
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
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

        <div className="mt-6 text-xs text-picwe-lightGrayText/70 space-y-2">
          <p>💡 提示：您可以手动输入钱包地址，或点击"连接"按钮从 MetaMask 自动获取</p>
          <p>
            如果没有安装 MetaMask，请访问{" "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-picwe-yellow hover:underline"
            >
              metamask.io
            </a>{" "}
            下载
          </p>
        </div>
      </div>
    </div>
  )
}
