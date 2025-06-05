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
      on: (eventName: string, handler: (...args: any[]) => void) => void
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void
    }
  }
}

export default function LoginForm() {
  const { loginWithWallet, isLoading: authLoading } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metamaskDetected, setMetamaskDetected] = useState<boolean | null>(null)

  // 强制只使用 MetaMask 提供者
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const anyEth = window.ethereum as any;
      // 支持稳定版 MetaMask (providers) 和 Nightly shim (detected)
      const list = anyEth.providers ?? anyEth.detected;
      if (Array.isArray(list) && list.length > 0) {
        const mm = list.find((p: any) => p.isMetaMask);
        window.ethereum = mm || list[0];
        console.log('选择的 Ethereum provider:', window.ethereum);
      }
    }
  }, []);

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
        setError("MetaMask未连接或已锁定。请在MetaMask中选择一个账户。")
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
  }, [])

  // 连接 MetaMask
  const connectWallet = async () => {
    if (isSigning) return;
    
    setIsSigning(true);
    try {
      setError(null)
      setIsConnecting(true)

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
      const startTime = Date.now();
      
      // 获取 nonce
      const nonceRes = await fetch("/api/auth/nonce");
      const nonceReceivedTime = Date.now();
      const { nonce } = await nonceRes.json();
      
      // 解析 nonce 中的时间戳
      const [timestampStr] = nonce.split('-');
      const generatedTime = parseInt(timestampStr, 10);
      
      console.log("Nonce 时间线:", {
        生成时间: new Date(generatedTime).toISOString(),
        接收时间: new Date(nonceReceivedTime).toISOString(),
        时间差: `${nonceReceivedTime - generatedTime}ms`,
        当前时间: new Date().toISOString()
      });
      
      // 创建要签名的消息
      const message = `请签名此消息以验证您的身份：\n\n随机码: ${nonce}\n\n此操作不会产生任何费用。`

      // 请求签名
      const signature = await window.ethereum!.request({
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
      console.error("签名错误详情:", error);
      let errorMessage = "签名过程中发生错误。"

      if (error.code === 4001) {
        errorMessage = "用户拒绝了签名请求。"
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setAddress(null) // 签名失败时清除地址，允许重试
    } finally {
      setIsSigning(false)
    }
  }

  // 断开连接
  const disconnectWallet = () => {
    console.log("断开钱包连接")
    setAddress(null)
    setError(null)
    setIsSigning(false)
    setIsConnecting(false)

    // 清除任何可能的缓存状态
    if (typeof window !== "undefined") {
      // 不清除 localStorage 中的登录状态，只清除当前连接状态
      console.log("钱包连接已断开")
    }
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
        <p className="text-lg text-picwe-lightGrayText mb-10">连接您的 MetaMask 钱包，开启航海之旅。</p>

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
              <div className="space-y-3">
                <Button
                  onClick={() => handleSignMessage(address)}
                  className="w-full bg-picwe-yellow text-picwe-black text-lg font-semibold py-4 rounded-xl hover:bg-yellow-400 transition-all duration-300 ease-in-out"
                  disabled={isLoading}
                >
                  重新签名登录
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnectWallet}
                  className="w-full border-picwe-yellow text-picwe-yellow hover:bg-picwe-yellow hover:text-picwe-black text-lg font-semibold py-4 rounded-xl transition-all duration-300 ease-in-out"
                >
                  断开连接
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={connectWallet}
                className="w-full bg-picwe-yellow text-picwe-black text-lg font-semibold py-4 rounded-xl hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-300/50 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-picwe-yellow/30"
                disabled={metamaskDetected === false}
              >
                <Wallet className="mr-3 h-6 w-6" />
                连接 MetaMask 钱包
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
                未检测到MetaMask钱包。请安装MetaMask后再试。
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-picwe-yellow hover:underline text-sm mt-2 inline-block"
              >
                下载MetaMask
              </a>
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
