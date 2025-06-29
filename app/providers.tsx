"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Distributor } from "@/lib/database"
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

// Auth Context
interface AuthContextType {
  currentUser: Distributor | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithWallet: (
    walletAddress: string,
    nonce: string,
    signature: string,
  ) => Promise<{ success: boolean; message: string }>
  logout: () => void
  registerCrew: (
    name: string,
    email: string,
    walletAddress: string,
    uplineReferralCode: string,
  ) => Promise<{ success: boolean; message: string }>
  registerCaptain: (
    name: string,
    email: string,
    walletAddress: string,
  ) => Promise<{ success: boolean; message: string }>
  allDistributorsData: Distributor[]
  getDownlineDetails: (distributorId: string) => Distributor[]
  refreshData: () => Promise<void>
  approveDistributor: (id: string) => Promise<{ success: boolean; message: string }>
  rejectDistributor: (id: string) => Promise<{ success: boolean; message: string }>
  adminRegisterOrPromoteCaptain: (
    name: string,
    email: string,
    walletAddress: string,
    existingId?: string,
  ) => Promise<{ success: boolean; message: string }>
  deleteDistributor: (id: string) => Promise<{ success: boolean; message: string }>
  updateDistributorInfo: (id: string, name: string, email: string) => Promise<{ success: boolean; message: string }>
  addAdmin: (name: string, email: string, walletAddress: string) => Promise<{ success: boolean; message: string }>
  updateAdmin: (id: string, name: string, email: string, walletAddress: string) => Promise<{ success: boolean; message: string }>
  deleteAdmin: (id: string) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_WALLET_ADDRESS = "0x442368f7b5192f9164a11a5387194cb5718673b9"

// 获取用于 fetch 的 Authorization header，如果无 token 则返回 undefined
const getAuthHeaders = (): HeadersInit | undefined => {
  if (typeof window === "undefined") return undefined
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Distributor | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [allDistributorsData, setAllDistributorsData] = useState<Distributor[]>([])
  const router = useRouter()
  const pathname = usePathname()

  const fetchAllDistributors = useCallback(async (): Promise<Distributor[]> => {
    // 只有在用户已认证的情况下才获取分销商数据
    const headers = getAuthHeaders()
    if (!headers) {
      console.log("No auth token available, skipping distributors fetch")
      setAllDistributorsData([])
      return []
    }

    try {
      const response = await fetch("/api/distributors", { headers })
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Unauthorized to fetch distributors")
          setAllDistributorsData([])
          return []
        }
        throw new Error("Failed to fetch distributors")
      }
      const data: Distributor[] = await response.json()

      if (!Array.isArray(data)) {
        console.error("Invalid data format received for all distributors:", data)
        return []
      }

      // Calculate ranks
      const distributorsForRanking = data.filter((d) => d.role === "distributor" && d.status === "approved")
      const sortedDistributors = [...distributorsForRanking].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      const rankedDistributorsMap = new Map(sortedDistributors.map((d, index) => [d.id, index + 1]))

      const allDataWithRanks = data.map((d) => ({
        ...d,
        rank: rankedDistributorsMap.get(d.id) || undefined,
      }))

      setAllDistributorsData(allDataWithRanks)
      return allDataWithRanks
    } catch (error) {
      console.error("Error fetching distributors:", error)
      setAllDistributorsData([])
      return []
    }
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)

    // 只有在用户已认证时才获取分销商数据
    if (isAuthenticated) {
      await fetchAllDistributors()
    }

    // If a user is logged in, refresh their specific data too
    if (currentUser && currentUser.walletAddress) {
      try {
        const response = await fetch(`/api/distributors/wallet/${currentUser.walletAddress}`, {
          headers: getAuthHeaders(),
        })
        if (response.ok) {
          const userData: Distributor = await response.json()
          if (
            userData &&
            (userData.status === "approved" || userData.status === "pending" || userData.role === "admin")
          ) {
            // Update rank for current user based on refreshed allDistributorsData
            const refreshedUserRank = allDistributorsData.find((d) => d.id === userData.id)?.rank
            setCurrentUser({ ...userData, rank: refreshedUserRank })
          } else {
            // User status might have changed
            logout()
          }
        } else {
          // 如果是管理员地址，即使数据库中没有记录也不要登出
          const isAdminAddress = currentUser.walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
          if (!isAdminAddress) {
            logout()
          }
        }
      } catch (error) {
        console.error("Error refreshing current user data:", error)
        // 如果是管理员地址，即使出错也不要登出
        const isAdminAddress = currentUser.walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
        if (!isAdminAddress) {
          logout()
        }
      }
    }
    setIsLoading(false)
  }, [fetchAllDistributors, currentUser, isAuthenticated, allDistributorsData])

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        if (typeof window !== "undefined") {
          const storedUserAddress = localStorage.getItem("currentUserAddress")
          const storedToken = localStorage.getItem("token")

          if (storedUserAddress && storedToken) {
            try {
              const response = await fetch(`/api/distributors/wallet/${storedUserAddress}`, {
                headers: { Authorization: `Bearer ${storedToken}` },
              })
              if (response.ok) {
                const userData: Distributor = await response.json()
                if (
                  userData &&
                  (userData.status === "approved" || userData.status === "pending" || userData.role === "admin")
                ) {
                  setCurrentUser(userData)
                  setIsAuthenticated(true)

                  // 用户认证成功后，再获取分销商数据
                  const fetchedDistributors = await fetchAllDistributors()
                  const userRank = fetchedDistributors.find((d) => d.id === userData.id)?.rank
                  setCurrentUser((prev) => (prev ? { ...prev, rank: userRank } : null))
                } else {
                  localStorage.removeItem("currentUserAddress")
                  localStorage.removeItem("token")
                }
              } else {
                // 检查是否是管理员地址
                const isAdminAddress = storedUserAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
                if (isAdminAddress) {
                  // 为管理员创建临时用户对象
                  const adminUser: Distributor = {
                    id: "admin-temp",
                    walletAddress: storedUserAddress,
                    name: "Platform Administrator",
                    email: "admin@picwe.com",
                    role: "admin",
                    roleType: "admin",
                    status: "approved",
                    registrationTimestamp: Date.now(),
                    registrationDate: new Date().toISOString().split("T")[0],
                    referralCode: "ADMINXYZ",
                    totalPoints: 0,
                    personalPoints: 0,
                    commissionPoints: 0,
                    referredUsers: [],
                    teamSize: 0,
                  }
                  setCurrentUser(adminUser)
                  setIsAuthenticated(true)

                  // 管理员认证成功后，也获取分销商数据
                  await fetchAllDistributors()
                } else {
                  localStorage.removeItem("currentUserAddress")
                  localStorage.removeItem("token")
                }
              }
            } catch (error) {
              console.error("Error fetching user data from stored address:", error)
              localStorage.removeItem("currentUserAddress")
              localStorage.removeItem("token")
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }
    initializeAuth()
  }, [fetchAllDistributors])

  const loginWithWallet = async (
    walletAddress: string,
    nonce: string,
    signature: string,
  ): Promise<{ success: boolean; message: string }> => {
    console.log("loginWithWallet called with:", { walletAddress, nonce: nonce.substring(0, 10) + "..." })
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, nonce, signature }),
      })

      console.log("API response status:", response.status)
      const result = await response.json()
      console.log("API response data:", result)

      if (response.ok && result.distributor) {
        // 登录成功后，先存储返回的 JWT，以便后续接口请求携带 Authorization
        if (result.token) {
          localStorage.setItem("token", result.token)
        }
        const userData: Distributor = result.distributor

        if (!userData || typeof userData !== "object") {
          throw new Error("Invalid user data received from server")
        }

        // Ensure registrationDate exists and is valid
        if (!userData.registrationDate) {
          userData.registrationDate = new Date().toISOString().split("T")[0]
        }

        console.log("Login successful, user data:", {
          role: userData.role,
          roleType: userData.roleType,
          status: userData.status,
          walletAddress: userData.walletAddress,
        })

        setCurrentUser(userData)
        setIsAuthenticated(true)
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserAddress", userData.walletAddress)
        }

        // 用户登录成功后，获取分销商数据以计算排名
        let allDistributors: Distributor[] = []
        try {
          allDistributors = await fetchAllDistributors()
        } catch (error) {
          console.error("Error fetching distributors during login:", error)
          // Proceed without distributors data
          allDistributors = []
        }
        const userRank = allDistributors.find((d) => d.id === userData.id)?.rank
        setCurrentUser((prev) => (prev ? { ...prev, rank: userRank } : null))

        // 根据用户角色进行重定向
        if (userData.role === "admin") {
          console.log("Redirecting admin to admin dashboard")
          router.push("/admin/dashboard")
        } else {
          console.log("Redirecting user to user dashboard")
          router.push("/dashboard")
        }

        return { success: true, message: result.message || "Login successful!" }
      } else {
        // Clear any partial auth state on failure
        setCurrentUser(null)
        setIsAuthenticated(false)
        if (typeof window !== "undefined") {
          localStorage.removeItem("currentUserAddress")
          localStorage.removeItem("token")
        }
        return { success: false, message: result.error || "Login verification failed." }
      }
    } catch (error) {
      console.error("Login error:", error)
      setCurrentUser(null)
      setIsAuthenticated(false)
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUserAddress")
        localStorage.removeItem("token")
      }
      return { success: false, message: "Client error occurred during login." }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    setAllDistributorsData([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserAddress")
      localStorage.removeItem("token")
    }
    if (pathname?.startsWith("/admin")) {
      router.push("/admin/login")
    } else {
      router.push("/")
    }
  }

  const registerCrew = async (name: string, email: string, walletAddress: string, uplineReferralCode: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/distributors/register-crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress, uplineReferralCode }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "Crew registration successful! You can now log in." }
      }
      return { success: false, message: result.error || "Registration failed, please check your information." }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, message: "An error occurred during registration." }
    } finally {
      setIsLoading(false)
    }
  }

  const registerCaptain = async (name: string, email: string, walletAddress: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/distributors/register-captain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return {
          success: true,
          message: result.message || "Captain application submitted successfully! Please wait for admin approval.",
        }
      }
      return { success: false, message: result.error || "Registration failed, please check your information." }
    } catch (error) {
      console.error("Captain registration error:", error)
      return { success: false, message: "An error occurred during registration." }
    } finally {
      setIsLoading(false)
    }
  }

  const approveDistributor = async (id: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为admin权限
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, message: "只有管理员可以批准船长申请" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/distributors/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "船长申请已批准" }
      }
      return { success: false, message: result.error || "批准失败" }
    } catch (error) {
      console.error("Approve distributor error:", error)
      return { success: false, message: "批准过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const rejectDistributor = async (id: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为admin权限
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, message: "只有管理员可以拒绝船长申请" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/distributors/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "船长申请已拒绝" }
      }
      return { success: false, message: result.error || "拒绝失败" }
    } catch (error) {
      console.error("Reject distributor error:", error)
      return { success: false, message: "拒绝过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const adminRegisterOrPromoteCaptain = async (
    name: string,
    email: string,
    walletAddress: string,
    existingId?: string,
  ): Promise<{ success: boolean; message: string }> => {
    // 检查是否为admin权限
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, message: "只有管理员可以注册或提升船长" }
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/distributors/admin-captain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, email, walletAddress, existingId }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "船长操作成功" }
      }
      return { success: false, message: result.error || "船长操作失败" }
    } catch (error) {
      console.error("Admin captain operation error:", error)
      return { success: false, message: "船长操作过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDistributor = async (id: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为初始管理员权限 (只有初始管理员可以删除)
    if (!currentUser || currentUser.role !== "admin" || currentUser.walletAddress.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return { success: false, message: "只有初始管理员可以删除船员记录" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/distributors/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "船员已删除" }
      }
      return { success: false, message: result.error || "删除失败" }
    } catch (error) {
      console.error("Delete distributor error:", error)
      return { success: false, message: "删除过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const addAdmin = async (name: string, email: string, walletAddress: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为初始管理员权限 (只有初始管理员可以添加新管理员)
    if (!currentUser || currentUser.role !== "admin" || currentUser.walletAddress.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return { success: false, message: "只有初始管理员可以添加新管理员" }
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, email, walletAddress }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "管理员添加成功" }
      }
      return { success: false, message: result.error || "添加管理员失败" }
    } catch (error) {
      console.error("Add admin error:", error)
      return { success: false, message: "添加管理员过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const updateAdmin = async (id: string, name: string, email: string, walletAddress: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为初始管理员权限 (只有初始管理员可以更新管理员信息)
    if (!currentUser || currentUser.role !== "admin" || currentUser.walletAddress.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return { success: false, message: "只有初始管理员可以更新管理员信息" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, email, walletAddress }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "管理员信息已更新" }
      }
      return { success: false, message: result.error || "更新管理员失败" }
    } catch (error) {
      console.error("Update admin error:", error)
      return { success: false, message: "更新管理员过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAdmin = async (id: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为初始管理员权限 (只有初始管理员可以删除管理员)
    if (!currentUser || currentUser.role !== "admin" || currentUser.walletAddress.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return { success: false, message: "只有初始管理员可以删除管理员" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "管理员已删除" }
      }
      return { success: false, message: result.error || "删除管理员失败" }
    } catch (error) {
      console.error("Delete admin error:", error)
      return { success: false, message: "删除管理员过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  const getDownlineDetails = useCallback(
    (distributorId: string): Distributor[] => {
      const directDownlines = allDistributorsData.filter((d) => d.uplineDistributorId === distributorId)

      return directDownlines.map((downline) => {
        const downlineDistributorIds = allDistributorsData
          .filter((d) => d.uplineDistributorId === downline.id)
          .map((d) => d.id)

        return {
          ...downline,
          downline_distributor_ids: downlineDistributorIds,
        }
      })
    },
    [allDistributorsData],
  )

  const updateDistributorInfo = async (id: string, name: string, email: string): Promise<{ success: boolean; message: string }> => {
    // 检查是否为管理员权限
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, message: "只有管理员可以更新分销商信息" }
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/distributors/${id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, email }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message || "分销商信息更新成功" }
      }
      return { success: false, message: result.error || "更新失败" }
    } catch (error) {
      console.error("Update distributor info error:", error)
      return { success: false, message: "更新过程中发生错误" }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        loginWithWallet,
        logout,
        registerCrew,
        registerCaptain,
        allDistributorsData,
        getDownlineDetails,
        refreshData,
        approveDistributor,
        rejectDistributor,
        adminRegisterOrPromoteCaptain,
        deleteDistributor,
        updateDistributorInfo,
        addAdmin,
        updateAdmin,
        deleteAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Combined Providers
export function AppProviders({ children }: { children: ReactNode }) {
  // Language state
  const [language, setLanguage] = useState<Language>("en")

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

  const languageValue = {
    language,
    setLanguage: handleSetLanguage,
    t,
  }

  return (
    <LanguageContext.Provider value={languageValue}>
      <AuthProvider>{children}</AuthProvider>
    </LanguageContext.Provider>
  )
}
