"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Distributor } from "@/lib/database" // Import camelCase interfaces

interface AuthContextType {
  currentUser: Distributor | null
  isAuthenticated: boolean
  isLoading: boolean // General loading for auth operations
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
  approveDistributor: (distributorId: string) => Promise<void>
  rejectDistributor: (distributorId: string) => Promise<void>
  adminRegisterOrPromoteCaptain: (
    name: string,
    email: string,
    walletAddress: string,
    existingId?: string,
  ) => Promise<{ success: boolean; message: string }>
  allDistributorsData: Distributor[]
  getDownlineDetails: (distributorId: string) => Distributor[] // Should return Distributor[]
  refreshData: () => Promise<void>
  triggerMockReferralPoints: (
    referredCustomerAddress: string,
    newWusdBalance: number,
  ) => Promise<{ success: boolean; message: string }>
  adminManualAddPoints: (
    targetDistributorWalletAddress: string,
    points: number,
    pointType: "personal" | "commission",
  ) => Promise<{ success: boolean; message: string }>
  // 新增管理员管理功能
  addAdmin: (name: string, email: string, walletAddress: string) => Promise<{ success: boolean; message: string }>
  updateAdmin: (
    id: string,
    name: string,
    email: string,
    walletAddress: string,
  ) => Promise<{ success: boolean; message: string }>
  deleteAdmin: (id: string) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_WALLET_ADDRESS = "0x442368f7b5192f9164a11a5387194cb5718673b9" // 更新的管理员地址

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Distributor | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // For initial load and major auth ops
  const [allDistributorsData, setAllDistributorsData] = useState<Distributor[]>([])
  const router = useRouter()
  const pathname = usePathname()

  const fetchAllDistributors = useCallback(async (): Promise<Distributor[]> => {
    try {
      const response = await fetch("/api/distributors")
      if (!response.ok) throw new Error("Failed to fetch distributors")
      const data: Distributor[] = await response.json() // Expecting camelCase data

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
    setIsLoading(true) // Indicate loading during refresh
    await fetchAllDistributors()
    // If a user is logged in, refresh their specific data too
    if (currentUser && currentUser.walletAddress) {
      try {
        const response = await fetch(`/api/distributors/wallet/${currentUser.walletAddress}`)
        if (response.ok) {
          const userData: Distributor = await response.json() // Expecting camelCase
          if (
            userData &&
            (userData.status === "approved" || userData.status === "pending" || userData.role === "admin")
          ) {
            // Update rank for current user based on refreshed allDistributorsData
            const refreshedUserRank = allDistributorsData.find((d) => d.id === userData.id)?.rank
            setCurrentUser({ ...userData, rank: refreshedUserRank })
          } else {
            // User status might have changed
            logout() // Log out if status is no longer valid
          }
        } else {
          // 如果是管理员地址，即使数据库中没有记录也不要登出
          const isAdminAddress = currentUser.walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
          if (!isAdminAddress) {
            logout() // Log out if user data fetch fails
          }
        }
      } catch (error) {
        console.error("Error refreshing current user data:", error)
        // 如果是管理员地址，即使出错也不要登出
        const isAdminAddress = currentUser.walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
        if (!isAdminAddress) {
          logout() // Log out on error
        }
      }
    }
    setIsLoading(false)
  }, [fetchAllDistributors, currentUser]) // Add currentUser to dependencies

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        const fetchedDistributors = await fetchAllDistributors() // Fetch all first to calculate ranks

        if (typeof window !== "undefined") {
          const storedUserAddress = localStorage.getItem("currentUserAddress")
          if (storedUserAddress) {
            try {
              const response = await fetch(`/api/distributors/wallet/${storedUserAddress}`)
              if (response.ok) {
                const userData: Distributor = await response.json() // Expecting camelCase
                if (
                  userData &&
                  (userData.status === "approved" || userData.status === "pending" || userData.role === "admin")
                ) {
                  // Find rank from the already fetched and ranked list
                  const userRank = fetchedDistributors.find((d) => d.id === userData.id)?.rank
                  setCurrentUser({ ...userData, rank: userRank })
                  setIsAuthenticated(true)
                } else {
                  localStorage.removeItem("currentUserAddress")
                }
              } else {
                // 检查是否是管理员地址
                const isAdminAddress = storedUserAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
                if (isAdminAddress) {
                  // 为管理员创建临时用户对象
                  const adminUser: Distributor = {
                    id: "admin-temp",
                    walletAddress: storedUserAddress,
                    name: "平台管理员",
                    email: "admin@picwe.com",
                    role: "admin",
                    roleType: "admin",
                    status: "approved",
                    registrationTimestamp: Date.now(),
                    registrationDate: (() => {
                      try {
                        return new Date().toISOString().split("T")[0]
                      } catch (error) {
                        console.error("Date formatting error:", error)
                        return new Date().toLocaleDateString("zh-CN")
                      }
                    })(),
                    referralCode: "ADMINXYZ",
                    totalPoints: 0,
                    personalPoints: 0,
                    commissionPoints: 0,
                    referredUsers: [],
                    rank: fetchedDistributors.find(
                      (d) => d.walletAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase(),
                    )?.rank,
                  }
                  setCurrentUser(adminUser)
                  setIsAuthenticated(true)
                } else {
                  localStorage.removeItem("currentUserAddress")
                }
              }
            } catch (error) {
              console.error("Error fetching user data from stored address:", error)
              localStorage.removeItem("currentUserAddress")
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
  }, [fetchAllDistributors]) // fetchAllDistributors is stable

  const loginWithWallet = async (
    walletAddress: string,
    nonce: string,
    signature: string,
  ): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, nonce, signature }),
      })

      const result = await response.json()

      if (response.ok && result.distributor) {
        const userData: Distributor = result.distributor // Already camelCase from API

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

        // Fetch all distributors to ensure ranks are up-to-date before setting current user
        let allDistributors: Distributor[] = []
        try {
          allDistributors = await fetchAllDistributors()
        } catch (error) {
          console.error("Error fetching distributors during login:", error)
          // Proceed without distributors data
          allDistributors = []
        }
        const userRank = allDistributors.find((d) => d.id === userData.id)?.rank

        setCurrentUser({ ...userData, rank: userRank })
        setIsAuthenticated(true)
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserAddress", userData.walletAddress)
        }

        // 根据用户角色进行重定向
        if (userData.role === "admin") {
          console.log("Redirecting admin to admin dashboard")
          router.push("/admin/dashboard")
        } else {
          console.log("Redirecting user to user dashboard")
          router.push("/dashboard")
        }
        return { success: true, message: result.message || "登录成功！" }
      } else {
        // Clear any partial auth state on failure
        setCurrentUser(null)
        setIsAuthenticated(false)
        if (typeof window !== "undefined") {
          localStorage.removeItem("currentUserAddress")
        }
        return { success: false, message: result.error || "登录验证失败。" }
      }
    } catch (error) {
      console.error("Login error:", error)
      setCurrentUser(null)
      setIsAuthenticated(false)
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUserAddress")
      }
      return { success: false, message: "登录过程中发生客户端错误。" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserAddress")
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
        return { success: true, message: result.message || "船员注册成功！您现在可以登录了。" }
      }
      return { success: false, message: result.error || "注册失败，请检查您的信息。" }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, message: "注册过程中发生错误。" }
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
        return { success: true, message: result.message || "船长申请提交成功！请等待管理员审核。" }
      }
      return { success: false, message: result.error || "注册失败，请检查您的信息。" }
    } catch (error) {
      console.error("Captain registration error:", error)
      return { success: false, message: "注册过程中发生错误。" }
    } finally {
      setIsLoading(false)
    }
  }

  const approveDistributor = async (distributorId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/distributors/${distributorId}/approve`, { method: "POST" })
      if (response.ok) await refreshData()
      else console.error("Failed to approve distributor", await response.json())
    } catch (error) {
      console.error("Error approving distributor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const rejectDistributor = async (distributorId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/distributors/${distributorId}/reject`, { method: "POST" })
      if (response.ok) await refreshData()
      else console.error("Failed to reject distributor", await response.json())
    } catch (error) {
      console.error("Error rejecting distributor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const adminRegisterOrPromoteCaptain = async (
    name: string,
    email: string,
    walletAddress: string,
    existingId?: string,
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/distributors/admin-captain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress, existingId }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message }
      }
      return { success: false, message: result.error }
    } catch (error) {
      console.error("Admin operation error:", error)
      return { success: false, message: "操作过程中发生错误。" }
    } finally {
      setIsLoading(false)
    }
  }

  const getDownlineDetails = useCallback(
    (distributorId: string): Distributor[] => {
      // This needs to recursively find all downlines, not just direct ones.
      // For now, it returns direct downlines.
      // A more complex function would be needed for full hierarchy.
      const directDownlines = allDistributorsData.filter((d) => d.uplineDistributorId === distributorId)
      // If you need to populate their 'downlineDistributors' recursively:
      // return directDownlines.map(dd => ({
      //   ...dd,
      //   downlineDistributors: getDownlineDetails(dd.id) // Recursive call
      // }));
      return directDownlines
    },
    [allDistributorsData],
  )

  const triggerMockReferralPoints = async (referredCustomerAddress: string, newWusdBalance: number) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/mock/trigger-referral-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referredCustomerAddress, newWusdBalance }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData() // Refresh data to see point changes
        return { success: true, message: result.message }
      }
      return { success: false, message: result.error || "Failed to trigger points." }
    } catch (error: any) {
      console.error("Error triggering mock points:", error)
      return { success: false, message: error.message || "Client error triggering points." }
    } finally {
      setIsLoading(false)
    }
  }

  const adminManualAddPoints = async (
    targetDistributorWalletAddress: string,
    points: number,
    pointType: "personal" | "commission",
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/add-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDistributorWalletAddress, points, pointType }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message }
      }
      return { success: false, message: result.error || "Failed to add points by admin." }
    } catch (error: any) {
      console.error("Error admin adding points:", error)
      return { success: false, message: error.message || "Client error admin adding points." }
    } finally {
      setIsLoading(false)
    }
  }

  // 新增管理员管理功能
  const addAdmin = async (name: string, email: string, walletAddress: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message }
      }
      return { success: false, message: result.error }
    } catch (error) {
      console.error("Error adding admin:", error)
      return { success: false, message: "添加管理员失败" }
    } finally {
      setIsLoading(false)
    }
  }

  const updateAdmin = async (id: string, name: string, email: string, walletAddress: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, walletAddress }),
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message }
      }
      return { success: false, message: result.error }
    } catch (error) {
      console.error("Error updating admin:", error)
      return { success: false, message: "更新管理员失败" }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAdmin = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (response.ok) {
        await refreshData()
        return { success: true, message: result.message }
      }
      return { success: false, message: result.error }
    } catch (error) {
      console.error("Error deleting admin:", error)
      return { success: false, message: "删除管理员失败" }
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
        approveDistributor,
        rejectDistributor,
        adminRegisterOrPromoteCaptain,
        allDistributorsData,
        getDownlineDetails,
        refreshData,
        triggerMockReferralPoints,
        adminManualAddPoints,
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
    throw new Error("useAuth 必须在 AuthProvider 内部使用")
  }
  return context
}

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>
}
