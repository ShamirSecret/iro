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

// Declare window.ethereum type
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

export default function RegisterFormEN() {
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

  // Get invitation code from URL parameters
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      setUplineReferralCode(code)
    }
  }, [searchParams])

  // Determine registration type
  const hasInvitationCode = uplineReferralCode.trim().length > 0
  const needsApproval = !hasInvitationCode

  // Check if crypto wallet is installed
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
        setWalletError("MetaMask is not connected or locked. Please select an account in MetaMask.")
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

  // Connect crypto wallet to get address
  const connectWallet = async () => {
    setWalletError(null)
    setIsConnectingWallet(true)

    try {
      if (!checkIfWalletInstalled()) {
        throw new Error("Please install a crypto wallet plugin. You can download from official wallet websites.")
      }

      if (!window.ethereum) {
        throw new Error("No crypto wallet plugin detected, please ensure it's installed and enabled.")
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("Unable to get wallet address, please ensure wallet is unlocked and authorized.")
      }

      // 将钱包地址转换为小写，确保格式一致
      const address = accounts[0].toLowerCase()
      setWalletAddress(address)
      setWalletError(null)
    } catch (error: any) {
      console.error("Crypto wallet connection error:", error)
      let errorMessage = "Failed to connect wallet, please try again."

      if (error.code === 4001) {
        errorMessage = "User rejected the connection request."
      } else if (error.code === -32002) {
        errorMessage = "Wallet connection request is being processed, please check wallet popup."
      } else if (error.message) {
        errorMessage = error.message
      }

      setWalletError(errorMessage)
    } finally {
      setIsConnectingWallet(false)
    }
  }

  // Disconnect wallet connection
  const disconnectWallet = () => {
    setWalletAddress("")
    setWalletError(null)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setMessage({ text: "Please enter a valid Ethereum wallet address.", type: "error" })
      return
    }

    // Username validation
    if (!/^[A-Za-z0-9]{3,20}$/.test(name)) {
      setMessage({ text: "Username can only contain 3-20 letters and numbers.", type: "error" })
      return
    }

    // Email validation
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 50) {
      setMessage({ text: "Please enter a valid email address with no more than 50 characters.", type: "error" })
      return
    }

    // 将钱包地址转换为小写，确保数据库中地址格式一致
    const normalizedWalletAddress = walletAddress.toLowerCase()

    // Use unified registerUser function, with invitation code for immediate approval, without for review
    const result = await registerUser(name, email, normalizedWalletAddress, uplineReferralCode.trim() || undefined)

    if (result.success) {
      setMessage({ text: result.message || "Registration successful!", type: "success" })
      setTimeout(() => router.push("/"), 3000)
    } else {
      setMessage({ text: result.message || "Registration failed, please check your information.", type: "error" })
    }
  }

  // Force use of main crypto wallet provider
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
        {/* Language switcher */}
        <div className="self-end mb-4">
          <LanguageSwitcher />
        </div>
        
        <Link href="/" className="mb-10 flex items-center space-x-3">
          <img src="/logo.jpg" alt="picwe Logo" className="h-12 w-12 rounded-lg" />
          <span className="text-3xl font-bold text-yellow-500">picwe</span>
        </Link>

        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          {hasInvitationCode ? (
            <div className="flex items-center justify-center space-x-2 text-cyan-400">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Invitation Code Registration</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <UserPlus className="h-5 w-5" />
              <span className="font-semibold">Direct Registration</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {hasInvitationCode
              ? "Register with invitation code for immediate access as crew member"
              : "Direct registration requires admin approval before use"}
          </p>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Join picwe</h1>
        <p className="text-md text-gray-400 mb-8">
          {hasInvitationCode
            ? "Fill in your information and provide invitation code to join the team immediately."
            : "Fill in your information to apply for membership, awaiting admin approval."}
        </p>

        <form onSubmit={handleRegister} className="w-full space-y-5">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="name" className="text-sm font-medium text-gray-300">
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Enter your email address"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="walletAddress" className="text-sm font-medium text-gray-300">
              Wallet Address (for receiving rewards)
            </Label>
            <div className="flex space-x-2">
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x... or click the button to connect crypto wallet"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500 flex-1"
              />
              {walletAddress ? (
                <Button
                  type="button"
                  onClick={disconnectWallet}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-3 flex items-center justify-center min-w-[120px]"
                  title="Disconnect wallet"
                >
                  <span className="text-sm">Disconnect</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnectingWallet}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-lg px-4 py-3 flex items-center justify-center min-w-[120px]"
                  title="Connect crypto wallet to get address"
                >
                  {isConnectingWallet ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-1" />
                      <span className="text-sm">Connect</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            {walletError && <p className="text-red-400 text-xs mt-1">{walletError}</p>}
            {walletAddress && (
              <p className="text-green-400 text-xs mt-1">
                ✓ Wallet address obtained: {walletAddress.substring(0, 6)}...
                {walletAddress.substring(walletAddress.length - 4)}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="uplineReferralCode" className="text-sm font-medium text-gray-300">
              Invitation Code{" "}
              {needsApproval && (
                <span className="text-gray-500">(Optional)</span>
              )}
            </Label>
            <Input
              id="uplineReferralCode"
              value={uplineReferralCode}
              onChange={(e) => setUplineReferralCode(e.target.value)}
              required={false}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg py-3 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder={
                needsApproval
                  ? "Enter invitation code for immediate access, otherwise requires approval"
                  : "Enter the inviter's invitation code"
              }
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
            {isLoading ? "Submitting..." : hasInvitationCode ? "Join Now" : "Apply to Join"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-yellow-500 hover:underline">
            Login here
          </Link>
        </p>

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p>
            💡 Tip: You can manually enter wallet address, or click "Connect" button to automatically get from crypto
            wallet
          </p>
          <p>
            If you haven't installed crypto wallet plugin, you can visit{" "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:underline"
            >
              metamask.io
            </a>{" "}
            or official wallet websites to download
          </p>
        </div>
      </div>
    </div>
  )
}
