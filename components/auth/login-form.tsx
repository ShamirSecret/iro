"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import Link from "next/link"
import { Loader2, Wallet, Zap } from "lucide-react"
import { useState, useEffect } from "react"

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
  }
}

export default function LoginForm() {
  const { loginWithWallet, isLoading: authLoading } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 检查是否安装了 MetaMask
  const checkIfMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum && window.ethereum.isMetaMask
  }

  useEffect(() => {
    if (!checkIfMetaMaskInstalled() || !window.ethereum) {
      return
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask accounts changed (login form):", accounts)
      if (accounts.length === 0) {
        setError("MetaMask未连接或已锁定。请在MetaMask中选择一个账户。")
        setAddress(null)
        // Potentially reset other states if needed, e.g., if a signing process was interrupted
        setIsSigning(false)
      } else {
        const newAddress = accounts[0]
        if (address !== newAddress) {
          // Only update if the address actually changed
          setAddress(newAddress)
          setError(null) // Clear previous errors related to connection
          setIsSigning(false) // Reset signing state as context has changed
        }
      }
    }

    // Attempt to get current accounts on mount, in case already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err) => console.error("Error fetching initial accounts:", err))

    window.ethereum.on("accountsChanged", handleAccountsChanged)

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
    // Add dependencies that, if changed, should re-run the effect.
    // For account changes, typically only on mount/unmount.
    // If setAddress or setError cause re-renders that re-run this, ensure they are stable or add to deps.
    // For now, empty array is fine for this event listener setup.
  }, [])

  // 连接 MetaMask
  const connectWallet = async () => {
    setError(null)
    setIsConnecting(true)

    try {
      // 检查是否安装了 MetaMask
      if (!checkIfMetaMaskInstalled()) {
        throw new Error("请安装 MetaMask 钱包后再试。您可以从 https://metamask.io 下载。")
      }

      if (!window.ethereum) {
        throw new Error("未检测到 MetaMask，请确保已安装并启用。")
      }

      // 请求连接账户
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("未能获取钱包地址，请确保 MetaMask 已解锁并授权连接。")
      }

      const walletAddress = accounts[0]
      setAddress(walletAddress)

      // 自动进行签名流程
      await handleSignMessage(walletAddress)
    } catch (error: any) {
      console.error("连接钱包错误:", error)
      let errorMessage = "连接钱包失败，请重试。"

      if (error.code === 4001) {
        errorMessage = "用户拒绝了连接请求。"
      } else if (error.code === -32002) {
        errorMessage = "MetaMask 连接请求已在处理中，请检查 MetaMask 弹窗。"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  // 签名消息
  const handleSignMessage = async (walletAddress: string) => {
    setIsSigning(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask 未检测到。")
      }

      // 获取 nonce
      const nonceResponse = await fetch("/api/auth/nonce")
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "获取签名挑战失败。")
      }
      const { nonce } = await nonceResponse.json()

      // 创建要签名的消息
      const message = `请签名此消息以验证您的身份：\n\n随机码: ${nonce}\n\n此操作不会产生任何费用。`

      // 请求签名
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress],
      })

      if (!signature) {
        throw new Error("未获取到签名。")
      }

      // 验证签名并登录
      const loginResult = await loginWithWallet(walletAddress, nonce, signature)

      if (!loginResult.success) {
        throw new Error(loginResult.message)
      }
    } catch (error: any) {
      console.error("签名错误:", error)
      let errorMessage = "签名过程中发生错误。"

      if (error.code === 4001) {
        errorMessage = "用户拒绝了签名请求。"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setAddress(null) // 清除地址，允许重试
    } finally {
      setIsSigning(false)
    }
  }

  // 断开连接
  const disconnectWallet = () => {
    setAddress(null)
    setError(null)
  }

  const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "未连接"
  const isLoading = isConnecting || isSigning || authLoading

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-picwe-black p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5"></div>

      <div className="z-10 flex flex-col items-center text-center max-w-md w-full">
        <Link href="/" className="mb-12 flex items-center space-x-3">
          <Zap className="h-10 w-10 text-picwe-yellow" />
          <span className="text-4xl font-bold text-picwe-yellow">PicWe</span>
        </Link>

        <h1 className="text-4xl font-extrabold text-white mb-4">进入您的专属领域</h1>
        <p className="text-lg text-picwe-lightGrayText mb-10">连接您的 MetaMask 钱包，开启经销商之旅。</p>

        <div className="w-full space-y-6">
          {isLoading ? (
            <Button
              className="w-full bg-picwe-yellow text-picwe-black text-lg font-semibold py-4 rounded-xl flex items-center justify-center disabled:opacity-70"
              disabled
            >
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              {isConnecting && "连接钱包中..."}
              {isSigning && "等待签名..."}
              {authLoading && "验证登录中..."}
            </Button>
          ) : address ? (
            <>
              <div className="bg-picwe-darkGray p-4 rounded-lg border border-gray-700">
                <p className="text-picwe-lightGrayText text-sm mb-2">已连接钱包:</p>
                <p className="font-mono text-white text-lg">{displayAddress}</p>
              </div>
              <Button
                variant="outline"
                onClick={disconnectWallet}
                className="w-full border-picwe-yellow text-picwe-yellow hover:bg-picwe-yellow hover:text-picwe-black text-lg font-semibold py-4 rounded-xl transition-all duration-300 ease-in-out"
              >
                断开连接
              </Button>
            </>
          ) : (
            <Button
              onClick={connectWallet}
              className="w-full bg-picwe-yellow text-picwe-black text-lg font-semibold py-4 rounded-xl hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-300/50 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-picwe-yellow/30"
            >
              <Wallet className="mr-3 h-6 w-6" />
              连接 MetaMask 钱包
            </Button>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm" aria-live="polite">
                {error}
              </p>
            </div>
          )}
        </div>

        <p className="mt-10 text-sm text-picwe-lightGrayText">
          还没有账户？{" "}
          <Link href="/register" className="font-medium text-picwe-yellow hover:underline">
            立即注册
          </Link>
        </p>

        <div className="mt-6 text-xs text-picwe-lightGrayText/70 space-y-2">
          <p>请确保您的 MetaMask 钱包已安装并连接到支持的网络</p>
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
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-picwe-darkGray/30 to-transparent"></div>
    </div>
  )
}
