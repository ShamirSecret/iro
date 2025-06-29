"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { Loader2, UserPlus, Anchor, Users, Wallet } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import LanguageSwitcher from "@/components/language-switcher"

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (eventName: string, handler: (...args: any[]) => void) => void
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void
    }
  }
}

export default function RegisterFormZH() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [uplineReferralCode, setUplineReferralCode] = useState("")
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const { registerUser, isLoading } = useAuth()
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
  const hasInvitationCode = uplineReferralCode.trim().length > 0
  const needsApproval = !hasInvitationCode

  // 检查是否安装了加密钱包
  const checkIfWalletInstalled = () => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const ethereum = window.ethereum
    if (!ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask accounts changed (register form):", accounts)
      if (accounts.length === 0) {
        setWalletError("MetaMask未连接或已锁定。请在MetaMask中选择一个账户。")
        setWalletAddress("")
      } else {
        const newAddress = accounts[0]
        if (walletAddress !== newAddress) {
          setWalletAddress(newAddress)
          setWalletError(null)
        }
      }
    }

    ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err) => console.error("Error fetching initial accounts (register):", err))

    ethereum.on("accountsChanged", handleAccountsChanged)

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  // 连接加密钱包获取地址
  const connectWallet = async () => {
    setWalletError(null)
    setIsConnectingWallet(true)

    try {
      if (!checkIfWalletInstalled()) {
        throw new Error("请安装加密钱包插件。您可以从各大钱包官网下载。")
      }

      if (!window.ethereum) {
        throw new Error("未检测到加密钱包插件，请确保已安装并启用。")
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("未能获取钱包地址，请确保钱包已解锁并授权连接。")
      }

      // 将钱包地址转换为小写，确保格式一致
      const address = accounts[0].toLowerCase()
      setWalletAddress(address)
      setWalletError(null)
    } catch (error: any) {
      console.error("连接加密钱包错误:", error)
      let errorMessage = "连接钱包失败，请重试。"

      if (error.code === 4001) {
        errorMessage = "用户拒绝了连接请求。"
      } else if (error.code === -32002) {
        errorMessage = "钱包连接请求已在处理中，请检查钱包弹窗。"
      } else if (error.message) {
        errorMessage = error.message
      }

      setWalletError(errorMessage)
    } finally {
      setIsConnectingWallet(false)
    }
  }

  // 断开钱包连接
  const disconnectWallet = () => {
    setWalletAddress("")
    setWalletError(null)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setMessage({ text: "请输入有效的以太坊钱包地址。", type: "error" })
      return
    }

    // 用户名校验
    if (!/^[A-Za-z0-9]{3,20}$/.test(name)) {
      setMessage({ text: "用户名只能由3-20位字母和数字组成。", type: "error" })
      return
    }

    // 邮箱校验
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 50) {
      setMessage({ text: "请输入有效的邮箱地址，且长度不超过50个字符。", type: "error" })
      return
    }

    // 将钱包地址转换为小写，确保数据库中地址格式一致
    const normalizedWalletAddress = walletAddress.toLowerCase()

    // 统一使用registerUser函数，有邀请码立即批准，无邀请码需要审核
    const result = await registerUser(name, email, normalizedWalletAddress, uplineReferralCode.trim() || undefined)

    if (result.success) {
      setMessage({ text: result.message || "注册成功！", type: "success" })
      setTimeout(() => router.push("/"), 3000)
    } else {
      setMessage({ text: result.message || "注册失败，请检查您的信息。", type: "error" })
    }
  }

  // 强制只使用加密钱包主 provider
  useEffect(() => {
    if (typeof window !== "undefined" && (window.ethereum as any)?.providers) {
      const providers = (window.ethereum as any).providers as any[]
      const mainProvider = providers.find((p: any) => p.isMetaMask) || providers[0]
      if (mainProvider) {
        window.ethereum = mainProvider
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* 语言切换按钮 */}
        <div className="self-end mb-4">
          <LanguageSwitcher />
        </div>
        
        <Link href="/" className="mb-10 flex items-center space-x-3">
          <img src="/logo.jpg" alt="PICWE Logo" className="h-12 w-12 rounded-lg" />
          <span className="text-2xl font-bold text-yellow-500">PICWE 第三代金融信誉系统</span>
        </Link>

        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          {hasInvitationCode ? (
            <div className="flex items-center justify-center space-x-2 text-cyan-400">
              <Users className="h-5 w-5" />
              <span className="font-semibold">邀请码注册</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <UserPlus className="h-5 w-5" />
              <span className="font-semibold">直接注册</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {hasInvitationCode ? "使用邀请码注册可立即使用，自动成为船员" : "直接注册需要管理员审核通过后才能使用"}
          </p>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">加入 PICWE 第三代金融信誉系统</h1>
        <p className="text-md text-gray-400 mb-8">
          {hasInvitationCode
            ? "填写您的信息并提供邀请码即可立即加入团队。"
            : "填写您的信息申请加入，需要等待管理员审核。"}
        </p>

        <form onSubmit={handleRegister} className="w-full space-y-5">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="name" className="text-sm font-medium text-gray-300">
              全名
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="请输入您的姓名"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="email" className="text-sm font-medium text-gray-300">
              邮箱地址
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="请输入您的邮箱"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="walletAddress" className="text-sm font-medium text-gray-300">
              钱包地址 (用于接收奖励)
            </Label>
            <div className="flex space-x-2">
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x... 或点击右侧按钮连接加密钱包"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500 flex-1"
              />
              {walletAddress ? (
                <Button
                  type="button"
                  onClick={disconnectWallet}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-3 flex items-center justify-center min-w-[120px]"
                  title="断开钱包连接"
                >
                  <span className="text-sm">断开</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnectingWallet}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-lg px-4 py-3 flex items-center justify-center min-w-[120px]"
                  title="连接加密钱包获取地址"
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
              )}
            </div>
            {walletError && <p className="text-red-400 text-xs mt-1">{walletError}</p>}
            {walletAddress && (
              <p className="text-green-400 text-xs mt-1">
                ✓ 已获取钱包地址: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="uplineReferralCode" className="text-sm font-medium text-gray-300">
              邀请码 {needsApproval && <span className="text-gray-500">(可选)</span>}
            </Label>
            <Input
              id="uplineReferralCode"
              value={uplineReferralCode}
              onChange={(e) => setUplineReferralCode(e.target.value)}
              required={false}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder={needsApproval ? "填写邀请码可立即生效，否则需审核" : "请输入邀请人的邀请码"}
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
            className="w-full bg-yellow-500 text-black text-md font-semibold py-3.5 rounded-xl hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-300/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 flex items-center justify-center shadow-lg shadow-yellow-500/30"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : hasInvitationCode ? (
              <UserPlus className="mr-2 h-5 w-5" />
            ) : (
              <Users className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "提交中..." : hasInvitationCode ? "立即加入" : "申请加入"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-gray-400">
          已有账户？{" "}
          <Link href="/" className="font-medium text-yellow-500 hover:underline">
            在此登录
          </Link>
        </p>

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p>💡 提示：您可以手动输入钱包地址，或点击"连接"按钮从加密钱包自动获取</p>
          <p>
            如果没有安装加密钱包插件，可访问
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:underline"
            >
              metamask.io
            </a>
            或各大钱包官网下载
          </p>
        </div>
      </div>
    </div>
  )
}
