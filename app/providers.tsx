"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { fetchAllDistributors } from "@/lib/utils"
import type { Distributor } from "@/lib/database"
import { toast } from "sonner"
import type { Language } from "@/lib/i18n"
import { getTranslation } from "@/lib/i18n"

// Language Context
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof import("@/lib/i18n").Translations) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Auth Context (existing code with language support)
interface User {
  id: string
  name: string
  email: string
  walletAddress: string
  role: "admin" | "distributor"
  status: "pending" | "approved" | "rejected"
  roleType?: "captain" | "crew"
  totalPoints?: number
  rank?: number
  referralCode?: string
  uplineId?: string
  createdAt: string
}

interface AuthContextType {
  currentUser: User | null
  allDistributorsData: Distributor[]
  isLoading: boolean
  loginWithWallet: (
    walletAddress: string,
    nonce: string,
    signature: string,
  ) => Promise<{ success: boolean; message: string }>
  logout: () => void
  registerCaptain: (
    name: string,
    email: string,
    walletAddress: string,
  ) => Promise<{ success: boolean; message: string }>
  registerCrew: (
    name: string,
    email: string,
    walletAddress: string,
    uplineReferralCode: string,
  ) => Promise<{ success: boolean; message: string }>
  refreshData: () => Promise<void>
  getDownlineDetails: (userId: string) => Distributor[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Combined Providers
export function AppProviders({ children }: { children: ReactNode }) {
  // Language state
  const [language, setLanguage] = useState<Language>("en")

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [allDistributorsData, setAllDistributorsData] = useState<Distributor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Translation function
  const t = (key: keyof import("@/lib/i18n").Translations) => getTranslation(language, key)

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference to localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  // Fetch distributors data (only when authenticated)
  const fetchDistributorsData = async (): Promise<void> => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      console.log("No auth token, skipping distributors fetch")
      return
    }

    try {
      const distributors = await fetchAllDistributors()
      setAllDistributorsData(distributors)
    } catch (error) {
      console.error("Error fetching distributors:", error)
      // Don't throw error, just log it
    }
  }

  // Initialize auth state
  const initializeAuth = async () => {
    const token = localStorage.getItem("authToken")
    const userData = localStorage.getItem("userData")

    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        // Only fetch distributors after user is authenticated
        await fetchDistributorsData()
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("authToken")
        localStorage.removeItem("userData")
      }
    }
  }

  useEffect(() => {
    initializeAuth()
  }, [])

  // Login with wallet
  const loginWithWallet = async (walletAddress: string, nonce: string, signature: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, nonce, signature }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("userData", JSON.stringify(data.user))
        setCurrentUser(data.user)

        // Fetch distributors data after successful login
        await fetchDistributorsData()

        toast.success(t("loginSuccess"))
        return { success: true, message: t("loginSuccess") }
      } else {
        return { success: false, message: data.message || t("loginFailed") }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: t("loginFailed") }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    setCurrentUser(null)
    setAllDistributorsData([]) // Clear distributors data on logout
    toast.success(language === "zh" ? "已退出登录" : "Logged out successfully")
  }

  // Register captain
  const registerCaptain = async (name: string, email: string, walletAddress: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/distributors/register-captain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress }),
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      console.error("Captain registration error:", error)
      return { success: false, message: t("registrationFailed") }
    } finally {
      setIsLoading(false)
    }
  }

  // Register crew
  const registerCrew = async (name: string, email: string, walletAddress: string, uplineReferralCode: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/distributors/register-crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress, uplineReferralCode }),
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      console.error("Crew registration error:", error)
      return { success: false, message: t("registrationFailed") }
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh data
  const refreshData = async () => {
    if (currentUser) {
      await fetchDistributorsData()
    }
  }

  // Get downline details
  const getDownlineDetails = (userId: string): Distributor[] => {
    return allDistributorsData.filter((distributor) => distributor.uplineId === userId)
  }

  const languageValue = {
    language,
    setLanguage: handleSetLanguage,
    t,
  }

  const authValue = {
    currentUser,
    allDistributorsData,
    isLoading,
    loginWithWallet,
    logout,
    registerCaptain,
    registerCrew,
    refreshData,
    getDownlineDetails,
  }

  return (
    <LanguageContext.Provider value={languageValue}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </LanguageContext.Provider>
  )
}
