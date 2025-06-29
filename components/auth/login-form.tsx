"use client"

import { Button } from "@/components/ui/button"
import { useAuth, useLanguage } from "@/app/providers"
import Link from "next/link"
import { Loader2, Wallet } from "lucide-react"
import { useState, useEffect } from "react"
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

export default function LoginForm() {
  const { loginWithWallet, isLoading: authLoading, logout } = useAuth()
  const { t } = useLanguage()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metamaskDetected, setMetamaskDetected] = useState<boolean | null>(null)

  // 强制只使用 MetaMask 提供者
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const anyEth = window.ethereum as any
      // 支持稳定版 MetaMask (providers) 和 Nightly shim (detected)
      const list = anyEth.providers ?? anyEth.detected
      if (Array.isArray(list) && list.length > 0) {
        const mm = list.find((p: any) => p.isMetaMask)
        window.ethereum = mm || list[0]
        console.log("Selected Ethereum provider:", window.ethereum)
      }
    }
  }, [])

  // 检查是否安装了 MetaMask
  const checkIfMetaMaskInstalled = () => {
    const isInstalled = typeof window !== "undefined" && typeof window.ethereum !== "undefined"
    setMetamaskDetected(!!isInstalled)
    return isInstalled
  }

  useEffect(() => {
    // 初始检查MetaMask是否安装
    checkIfMetaMaskInstalled()

    if (typeof window === "undefined") return
    const ethereum = window.ethereum
    if (!ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask accounts changed (login form):", accounts)
      if (accounts.length === 0) {
        setError(
          t("language") === "zh"
            ? "MetaMask未连接或已锁定。请在MetaMask中选择一个账户。"
            : "MetaMask not connected or locked. Please select an account in MetaMask.",
        )
        setAddress(null)
        setIsSigning(false)
      } else {
        const newAddress = accounts[0]
        if (address !== newAddress) {
          setAddress(newAddress)
          setError(null)
          setIsSigning(false)
        }
      }
    }

    // 获取当前账户并监听变更
    ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err) => console.error("Error fetching initial accounts:", err))

    ethereum.on("accountsChanged", handleAccountsChanged)

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [t])

  // 连接 MetaMask
  const connectWallet = async () => {
    if (isSigning) return

    setIsSigning(true)
    try {
      setError(null)
      setIsConnecting(true)

      // 检查是否安装了 MetaMask
      if (!checkIfMetaMaskInstalled()) {
        throw new Error(
          t("language") === "zh"
            ? "请安装 MetaMask 钱包后再试。您可以从 https://metamask.io 下载。"
            : "Please install MetaMask wallet. You can download it from https://metamask.io",
        )
      }

      if (!window.ethereum) {
        throw new Error(
          t("language") === "zh"
            ? "未检测到 MetaMask，请确保已安装并启用。"
            : "MetaMask not detected. Please make sure it's installed and enabled.",
        )
      }

      // 请求连接账户
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error(
          t("language") === "zh"
            ? "未能获取钱包地址，请确保 MetaMask 已解锁并授权连接。"
            : "Unable to get wallet address. Please make sure MetaMask is unlocked and authorized.",
        )
      }

      const walletAddress = accounts[0]
      setAddress(walletAddress)

      // 自动进行签名流程
      await handleSignMessage(walletAddress)
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      let errorMessage =
        t("language") === "zh" ? "连接钱包失败，请重试。" : "Failed to connect wallet. Please try again."

      if (error.code === 4001) {
        errorMessage = t("language") === "zh" ? "用户拒绝了连接请求。" : "User rejected the connection request."
      } else if (error.code === -32002) {
        errorMessage =
          t("language") === "zh"
            ? "MetaMask 连接请求已在处理中，请检查 MetaMask 弹窗。"
            : "MetaMask connection request is already pending. Please check MetaMask popup."
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setAddress(null) // 连接失败时清除地址
    } finally {
      setIsConnecting(false)
      setIsSigning(false)
    }
  }

  // 签名消息
  const handleSignMessage = async (walletAddress: string) => {
    setIsSigning(true)
    setError(null)

    try {
      console.log("Starting sign message process for address:", walletAddress)

      // 获取 nonce
      const nonceRes = await fetch("/api/auth/nonce")
      if (!nonceRes.ok) {
        throw new Error(`Failed to get nonce: ${nonceRes.status} ${nonceRes.statusText}`)
      }

      const nonceData = await nonceRes.json()
      const { nonce } = nonceData

      if (!nonce) {
        throw new Error("No nonce received from server")
      }

      console.log("Received nonce:", nonce)

      // 创建要签名的消息 - 使用与服务器端完全相同的格式
      const message = `Please sign this message to verify your identity:\n\nNonce: ${nonce}\n\nThis operation will not incur any fees.`

      console.log("Message to sign:", message)
      console.log("Message length:", message.length)
      console.log("Message bytes:", new TextEncoder().encode(message))

      // 请求签名
      const signature = await window.ethereum!.request({
        method: "personal_sign",
        params: [message, walletAddress],
      })

      if (!signature) {
        throw new Error(t("language") === "zh" ? "未获取到签名。" : "No signature received.")
      }

      console.log("Signature received:", signature.substring(0, 20) + "...")

      // 验证签名并登录
      console.log("Calling loginWithWallet...")
      const loginResult = await loginWithWallet(walletAddress, nonce, signature)
      console.log("Login result:", loginResult)

      if (!loginResult.success) {
        throw new Error(loginResult.message || "Login failed")
      }

      console.log("Login successful!")
    } catch (error: any) {
      console.error("Signing error details:", error)
      let errorMessage = t("language") === "zh" ? "签名过程中发生错误。" : "Error occurred during signing process."

      if (error.code === 4001) {
        errorMessage = t("language") === "zh" ? "用户拒绝了签名请求。" : "User rejected the signing request."
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setAddress(null) // 签名失败时清除地址，允许重试
    } finally {
      setIsSigning(false)
    }
  }

  // 断开连接 - 修复断开连接功能
  const disconnectWallet = async () => {
    console.log("Disconnecting wallet")

    try {
      // 清除本地状态
      setAddress(null)
      setError(null)
      setIsSigning(false)
      setIsConnecting(false)
      // 调用 logout 清除认证信息并重定向
      logout()

      // 清除localStorage中的认证信息
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("wallet_address")
        localStorage.removeItem("user_data")
      }

      // 尝试断开MetaMask连接（注意：MetaMask不支持程序化断开连接）
      // 用户需要在MetaMask中手动断开连接
      console.log("Wallet disconnected successfully")

      // 显示提示信息
      setError(
        t("language") === "zh"
          ? "已断开连接。如需完全断开，请在钱包中手动断开连接。"
          : "Disconnected. To fully disconnect, please manually disconnect in your wallet.",
      )

      // 3秒后清除提示信息
      setTimeout(() => {
        setError(null)
      }, 3000)
    } catch (error: any) {
      console.error("Error disconnecting wallet:", error)
      setError(t("language") === "zh" ? "断开连接时出现错误。" : "Error occurred while disconnecting.")
    }
  }

  const displayAddress = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : t("language") === "zh"
      ? "未连接"
      : "Not connected"
  const isLoading = isConnecting || isSigning || authLoading

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50"></div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-md w-full">
        <Link href="/" className="mb-12 flex items-center space-x-3">
          <img src="/logo.jpg" alt="PICWE Logo" className="h-10 w-10 rounded-lg" />
          <span className="text-2xl font-bold text-yellow-500">PICWE 第三代金融信誉系统</span>
        </Link>

        <h1 className="text-4xl font-extrabold text-white mb-4">
          {t("language") === "zh" ? "持有你的WEUSD" : "HODL YOUR WEUSD"}
        </h1>
        <p className="text-lg text-gray-300 mb-10">
          {t("language") === "zh"
            ? "连接你的加密钱包，开启你在加密海洋的伟大航行。"
            : "Connect your crypto wallet to start your great voyage in the cryptosea."}
        </p>

        <div className="w-full space-y-6">
          {isLoading ? (
            <Button
              className="w-full bg-yellow-500 text-black text-lg font-semibold py-4 rounded-xl flex items-center justify-center disabled:opacity-70"
              disabled
            >
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              {isConnecting && (t("language") === "zh" ? "连接钱包中..." : "Connecting wallet...")}
              {isSigning && (t("language") === "zh" ? "等待签名..." : "Waiting for signature...")}
              {authLoading && (t("language") === "zh" ? "验证登录中..." : "Verifying login...")}
            </Button>
          ) : address ? (
            <>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
                <p className="text-gray-400 text-sm mb-2">
                  {t("language") === "zh" ? "已连接钱包:" : "Connected wallet:"}
                </p>
                <p className="font-mono text-white text-lg">{displayAddress}</p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => handleSignMessage(address)}
                  className="w-full bg-yellow-500 text-black text-lg font-semibold py-4 rounded-xl hover:bg-yellow-400 transition-all duration-300 ease-in-out"
                  disabled={isLoading}
                >
                  {t("language") === "zh" ? "重新签名登录" : "Sign to Login Again"}
                </Button>
                <Button
                  onClick={disconnectWallet}
                  className="w-full border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white text-lg font-semibold py-4 rounded-xl transition-all duration-300 ease-in-out"
                >
                  {t("language") === "zh" ? "断开连接" : "Disconnect"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={connectWallet}
                className="w-full bg-yellow-500 text-black text-lg font-semibold py-4 rounded-xl hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-300/50 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-yellow-500/30"
                disabled={metamaskDetected === false}
              >
                <Wallet className="mr-3 h-6 w-6" />
                {t("language") === "zh" ? "连接加密钱包" : "Connect Crypto Wallet"}
              </Button>
            </>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm" aria-live="polite">
                {error}
              </p>
            </div>
          )}

          {metamaskDetected === false && (
            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mt-4">
              <p className="text-yellow-400 text-sm">
                {t("language") === "zh"
                  ? "未检测到加密钱包插件。请安装钱包插件（如 MetaMask, OKX, SafePal 等）后再试。"
                  : "No crypto wallet plugin detected. Please install a wallet plugin (such as MetaMask, OKX, SafePal, etc.) and try again."}
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 hover:underline text-sm mt-2 inline-block"
              >
                {t("language") === "zh" ? "了解常用钱包" : "Learn about popular wallets"}
              </a>
            </div>
          )}
        </div>

        <p className="mt-10 text-sm text-gray-400">
          {t("language") === "zh" ? "还没有账户？" : "Don't have an account?"}{" "}
          <Link href="/register" className="font-medium text-yellow-400 hover:text-yellow-300 hover:underline">
            {t("language") === "zh" ? "立即注册" : "Register now"}
          </Link>
        </p>

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p>
            {t("language") === "zh"
              ? "请确保您的加密钱包插件已安装并连接到支持的网络"
              : "Please ensure your crypto wallet plugin is installed and connected to a supported network"}
          </p>
          <p>
            {t("language") === "zh"
              ? "如果没有安装钱包插件，可访问"
              : "If you don't have a wallet plugin installed, visit "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 hover:underline"
            >
              metamask.io
            </a>
            {t("language") === "zh" ? "或各大钱包官网下载" : " or other wallet official websites to download"}
          </p>
        </div>
      </div>
    </div>
  )
}
