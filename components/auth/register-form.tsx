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
import { useLanguage } from "@/app/providers"

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
  const { t } = useLanguage()

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
          // Only update if the address actually changed
          setWalletAddress(newAddress)
          setWalletError(null)
        }
      }
    }

    // Attempt to get current accounts on mount
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
  }, []) // 移除 walletAddress 依赖，避免无限循环

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

      const address = accounts[0]
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
              <span className="font-semibold">{t("registerAsCaptain")}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-cyan-400">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{t("registerAsCrew")}</span>
            </div>
          )}
          <p className="text-xs text-picwe-lightGrayText mt-2">
            {isCaptainRegistration ? t("captainRegistrationNote") : t("crewRegistrationNote")}
          </p>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          {isCaptainRegistration ? t("registerAsCaptain") : t("registerAsCrew")}
        </h1>
        <p className="text-md text-picwe-lightGrayText mb-8">
          {isCaptainRegistration ? t("captainRegistrationDesc") : t("crewRegistrationDesc")}
        </p>

        <form onSubmit={handleRegister} className="w-full space-y-5">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="name" className="text-sm font-medium text-picwe-lightGrayText">
              {t("fullName")}
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
              {t("emailAddress")}
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
              {t("walletAddressForRewards")}
            </Label>
            <div className="flex space-x-2">
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x... 或点击右侧按钮连接加密钱包"
                required
                className="bg-picwe-darkGray border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-picwe-yellow focus:border-picwe-yellow flex-1"
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
                  className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 rounded-lg px-4 py-3 flex items-center justify-center min-w-[120px]"
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
            <Label htmlFor="uplineReferralCode" className="text-sm font-medium text-picwe-lightGrayText">
              {t("invitationCode")}{" "}
              {isCaptainRegistration && <span className="text-gray-500">(可选，不填则注册船长)</span>}
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
          <p>💡 提示：您可以手动输入钱包地址，或点击"连接"按钮从加密钱包自动获取</p>
          <p>
            如果没有安装加密钱包插件，可访问
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-picwe-yellow hover:underline"
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
