"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

// Distributor interface remains the same
export interface Distributor {
  id: string
  walletAddress: string
  name: string
  email: string
  role: "distributor" | "admin"
  roleType: "captain" | "crew" | "admin"
  status: "pending" | "approved" | "rejected"
  registrationTimestamp: number
  registrationDate: string
  referralCode: string
  uplineDistributorId?: string
  downlineDistributorIds: string[]
  totalPoints: number
  personalPoints: number
  commissionPoints: number
  rank?: number
  referredUsers: Array<{
    id: string
    address: string
    wusdBalance: number
    pointsEarned: number
  }>
}

interface AuthContextType {
  currentUser: Distributor | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithWallet: () => Promise<void>
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
  getDownlineDetails: (distributorId: string) => Distributor[]
  addPointsToDistributor: (distributorId: string, points: number, isDirectEarning: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_WALLET_ADDRESS = "0x2574Ef9402f30C9cACE4E0b29FB4160d622Efd"
const UPLINE_COMMISSION_RATE = 0.1

// Replace the formatDate function with a safer version
const formatDate = (timestamp: number): string => {
  try {
    if (!timestamp || isNaN(timestamp)) {
      return new Date().toLocaleDateString("zh-CN")
    }
    return new Date(timestamp).toLocaleDateString("zh-CN")
  } catch (error) {
    console.error("Date formatting error:", error)
    return new Date().toLocaleDateString("zh-CN")
  }
}

// Update the mock data to use proper date formatting
let MOCK_DISTRIBUTORS_DB: Distributor[] = [
  {
    id: "admin0",
    walletAddress: ADMIN_WALLET_ADDRESS,
    name: "平台管理员",
    email: "admin@example.com",
    role: "admin",
    roleType: "admin",
    status: "approved",
    registrationTimestamp: new Date("2023-01-01T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-01-01T10:00:00Z").getTime()),
    referralCode: "ADMINXYZ",
    uplineDistributorId: undefined,
    downlineDistributorIds: [],
    totalPoints: 0,
    personalPoints: 0,
    commissionPoints: 0,
    referredUsers: [],
  },
  {
    id: "captainAlice",
    walletAddress: "0xCaptainAliceWallet00000000000000000000",
    name: "船长Alice",
    email: "alice@captain.com",
    role: "distributor",
    roleType: "captain",
    status: "approved",
    registrationTimestamp: new Date("2023-02-01T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-02-01T10:00:00Z").getTime()),
    referralCode: "ALICE001",
    uplineDistributorId: undefined,
    downlineDistributorIds: ["crewBob", "crewCharlie"],
    totalPoints: 50000,
    personalPoints: 30000,
    commissionPoints: 20000,
    referredUsers: [
      { id: "ref1", address: "0x1234567890123456789012345678901234567890", wusdBalance: 10000, pointsEarned: 1000 },
      { id: "ref2", address: "0x2345678901234567890123456789012345678901", wusdBalance: 15000, pointsEarned: 1500 },
    ],
  },
  {
    id: "captainDave",
    walletAddress: "0xCaptainDaveWallet00000000000000000000",
    name: "船长Dave",
    email: "dave@captain.com",
    role: "distributor",
    roleType: "captain",
    status: "approved",
    registrationTimestamp: new Date("2023-02-15T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-02-15T10:00:00Z").getTime()),
    referralCode: "DAVE002",
    uplineDistributorId: undefined,
    downlineDistributorIds: ["crewEve"],
    totalPoints: 15000,
    personalPoints: 10000,
    commissionPoints: 5000,
    referredUsers: [
      { id: "ref3", address: "0x3456789012345678901234567890123456789012", wusdBalance: 8000, pointsEarned: 800 },
    ],
  },
  {
    id: "crewBob",
    walletAddress: "0xCrewBobWalletAlice00000000000000000000",
    name: "船员Bob (Alice下级)",
    email: "bob@crew.com",
    role: "distributor",
    roleType: "crew",
    status: "approved",
    registrationTimestamp: new Date("2023-03-01T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-03-01T10:00:00Z").getTime()),
    referralCode: "BOB123",
    uplineDistributorId: "captainAlice",
    downlineDistributorIds: ["crewFrank"],
    totalPoints: 11000,
    personalPoints: 10000,
    commissionPoints: 1000,
    referredUsers: [
      { id: "ref4", address: "0x4567890123456789012345678901234567890123", wusdBalance: 5000, pointsEarned: 500 },
    ],
  },
  {
    id: "crewCharlie",
    walletAddress: "0xCrewCharlieWalletAlice000000000000000",
    name: "船员Charlie (Alice下级)",
    email: "charlie@crew.com",
    role: "distributor",
    roleType: "crew",
    status: "approved",
    registrationTimestamp: new Date("2023-03-05T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-03-05T10:00:00Z").getTime()),
    referralCode: "CHARLIE456",
    uplineDistributorId: "captainAlice",
    downlineDistributorIds: [],
    totalPoints: 5000,
    personalPoints: 5000,
    commissionPoints: 0,
    referredUsers: [],
  },
  {
    id: "crewFrank",
    walletAddress: "0xCrewFrankWalletBob0000000000000000000",
    name: "船员Frank (Bob下级)",
    email: "frank@crew.com",
    role: "distributor",
    roleType: "crew",
    status: "approved",
    registrationTimestamp: new Date("2023-04-01T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-04-01T10:00:00Z").getTime()),
    referralCode: "FRANK789",
    uplineDistributorId: "crewBob",
    downlineDistributorIds: [],
    totalPoints: 1000,
    personalPoints: 1000,
    commissionPoints: 0,
    referredUsers: [],
  },
  {
    id: "crewEve",
    walletAddress: "0xCrewEveWalletDave00000000000000000000",
    name: "船员Eve (Dave下级)",
    email: "eve@crew.com",
    role: "distributor",
    roleType: "crew",
    status: "approved",
    registrationTimestamp: new Date("2023-03-10T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-03-10T10:00:00Z").getTime()),
    referralCode: "EVE000",
    uplineDistributorId: "captainDave",
    downlineDistributorIds: [],
    totalPoints: 5000,
    personalPoints: 5000,
    commissionPoints: 0,
    referredUsers: [],
  },
  {
    id: "captainPending",
    walletAddress: "0xCaptainPendingWallet000000000000000000",
    name: "待审核船长Grace",
    email: "grace@pending.com",
    role: "distributor",
    roleType: "captain",
    status: "pending",
    registrationTimestamp: new Date("2023-05-01T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-05-01T10:00:00Z").getTime()),
    referralCode: "GRACEPEND",
    uplineDistributorId: undefined,
    downlineDistributorIds: [],
    totalPoints: 0,
    personalPoints: 0,
    commissionPoints: 0,
    referredUsers: [],
  },
  {
    id: "captainRejected",
    walletAddress: "0xCaptainRejectedWallet00000000000000000",
    name: "已拒绝船长Hank",
    email: "hank@rejected.com",
    role: "distributor",
    roleType: "captain",
    status: "rejected",
    registrationTimestamp: new Date("2023-05-02T10:00:00Z").getTime(),
    registrationDate: formatDate(new Date("2023-05-02T10:00:00Z").getTime()),
    referralCode: "HANKREJ",
    uplineDistributorId: undefined,
    downlineDistributorIds: [],
    totalPoints: 0,
    personalPoints: 0,
    commissionPoints: 0,
    referredUsers: [],
  },
]

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Distributor | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [allDistributorsData, setAllDistributorsData] = useState<Distributor[]>([])
  const router = useRouter()
  const pathname = usePathname()

  const updateStateAfterDbChange = useCallback(
    (newDbSnapshot: Distributor[], activeUserContext: Distributor | null) => {
      const distributorsForRanking = newDbSnapshot.filter((d) => d.role === "distributor" && d.status === "approved")
      const sortedDistributors = [...distributorsForRanking].sort((a, b) => b.totalPoints - a.totalPoints)
      const rankedDistributors = sortedDistributors.map((d, index) => ({ ...d, rank: index + 1 }))

      const newAllData = newDbSnapshot.map((d) => {
        const rankedVersion = rankedDistributors.find((rd) => rd.id === d.id)
        return rankedVersion || d
      })
      setAllDistributorsData(newAllData)

      if (activeUserContext) {
        const updatedActiveUserData = newAllData.find((d) => d.id === activeUserContext.id)
        if (updatedActiveUserData) {
          setCurrentUser((currentInternalUser) => {
            if (JSON.stringify(updatedActiveUserData) !== JSON.stringify(currentInternalUser)) {
              return updatedActiveUserData
            }
            return currentInternalUser
          })
          if (updatedActiveUserData.status !== "approved" && updatedActiveUserData.status !== "pending") {
            setIsAuthenticated(false)
            if (
              typeof window !== "undefined" &&
              localStorage.getItem("currentUserAddress") === updatedActiveUserData.walletAddress
            ) {
              localStorage.removeItem("currentUserAddress")
            }
          }
        } else {
          setCurrentUser(null)
          setIsAuthenticated(false)
          if (
            typeof window !== "undefined" &&
            localStorage.getItem("currentUserAddress") === activeUserContext.walletAddress
          ) {
            localStorage.removeItem("currentUserAddress")
          }
        }
      }
    },
    [],
  )

  useEffect(() => {
    setIsLoading(true)
    let userFromStorage: Distributor | null = null
    let initialAuthStatus = false

    if (typeof window !== "undefined") {
      const storedUserAddress = localStorage.getItem("currentUserAddress")

      if (storedUserAddress) {
        userFromStorage = MOCK_DISTRIBUTORS_DB.find((d) => d.walletAddress === storedUserAddress) || null
        if (userFromStorage) {
          if (userFromStorage.status === "approved" || userFromStorage.status === "pending") {
            initialAuthStatus = true
          } else {
            localStorage.removeItem("currentUserAddress")
            userFromStorage = null
          }
        }
      }
    }

    setIsAuthenticated(initialAuthStatus)
    updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, userFromStorage)
    setIsLoading(false)
  }, [updateStateAfterDbChange])

  const loginWithWallet = async () => {
    setIsLoading(true)
    try {
      const selectionOptions = MOCK_DISTRIBUTORS_DB.map(
        (d, i) => `${i + 1}. ${d.name} (${d.roleType} - ${d.status} - ${d.walletAddress.substring(0, 6)}...)`,
      ).join("\n")
      const selection = prompt(`模拟连接钱包 - 请选择一个地址登录:\n${selectionOptions}\n输入数字选择:`)

      let chosenUserFromDb: Distributor | null = null
      if (selection && selection.trim()) {
        const index = Number.parseInt(selection.trim()) - 1
        if (index >= 0 && index < MOCK_DISTRIBUTORS_DB.length) {
          chosenUserFromDb = MOCK_DISTRIBUTORS_DB[index]
        }
      }

      if (chosenUserFromDb) {
        const userToLogin = allDistributorsData.find((d) => d.id === chosenUserFromDb!.id) || chosenUserFromDb

        if (userToLogin.status === "approved") {
          setIsAuthenticated(true)
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUserAddress", userToLogin.walletAddress)
          }
          setCurrentUser(userToLogin)

          if (userToLogin.role === "admin") {
            router.push("/admin/dashboard")
          } else {
            router.push("/dashboard")
          }
        } else if (userToLogin.status === "pending") {
          setIsAuthenticated(true)
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUserAddress", userToLogin.walletAddress)
          }
          setCurrentUser(userToLogin)
          router.push("/dashboard")
        } else if (userToLogin.status === "rejected") {
          alert("您的账户申请已被拒绝。")
          setIsAuthenticated(false)
          setCurrentUser(null)
          if (typeof window !== "undefined") {
            localStorage.removeItem("currentUserAddress")
          }
        } else {
          alert("账户状态未知，无法登录。")
          setIsAuthenticated(false)
          setCurrentUser(null)
          if (typeof window !== "undefined") {
            localStorage.removeItem("currentUserAddress")
          }
        }
      } else {
        alert("未选择或无效的用户。")
        setIsAuthenticated(false)
        setCurrentUser(null)
        if (typeof window !== "undefined") {
          localStorage.removeItem("currentUserAddress")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("登录过程中发生错误。")
      setIsAuthenticated(false)
      setCurrentUser(null)
    }
    setIsLoading(false)
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

  // 船员注册（无需审核，直接通过）
  const registerCrew = async (name: string, email: string, walletAddress: string, uplineReferralCode: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      const upline = MOCK_DISTRIBUTORS_DB.find(
        (d) => d.referralCode && d.referralCode.toLowerCase() === uplineReferralCode.toLowerCase(),
      )

      if (!upline) {
        setIsLoading(false)
        return { success: false, message: "无效的邀请码。" }
      }

      if (upline.status !== "approved") {
        setIsLoading(false)
        return { success: false, message: "邀请人账户未激活或无效。" }
      }

      if (
        MOCK_DISTRIBUTORS_DB.some(
          (d) =>
            (d.walletAddress && d.walletAddress.toLowerCase() === walletAddress.toLowerCase()) ||
            (d.email && d.email.toLowerCase() === email.toLowerCase()),
        )
      ) {
        setIsLoading(false)
        return { success: false, message: "钱包地址或邮箱已被注册。" }
      }

      const timestamp = Date.now()
      const newCrewMember: Distributor = {
        id: `crew${timestamp}`,
        walletAddress,
        name,
        email,
        role: "distributor",
        roleType: "crew",
        status: "approved", // 船员直接通过，无需审核
        registrationTimestamp: timestamp,
        registrationDate: formatDate(timestamp),
        referralCode: `${name.substring(0, 3).toUpperCase()}${timestamp.toString().slice(-4)}`,
        uplineDistributorId: upline.id,
        downlineDistributorIds: [],
        totalPoints: 0,
        personalPoints: 0,
        commissionPoints: 0,
        referredUsers: [],
      }

      MOCK_DISTRIBUTORS_DB = [...MOCK_DISTRIBUTORS_DB, newCrewMember]
      MOCK_DISTRIBUTORS_DB = MOCK_DISTRIBUTORS_DB.map((d) =>
        d.id === upline.id
          ? { ...d, downlineDistributorIds: [...(d.downlineDistributorIds || []), newCrewMember.id] }
          : d,
      )

      updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
      setIsLoading(false)
      return { success: true, message: "船员注册成功！您现在可以登录了。" }
    } catch (error) {
      console.error("Registration error:", error)
      setIsLoading(false)
      return { success: false, message: "注册过程中发生错误。" }
    }
  }

  // 船长注册（需要审核）
  const registerCaptain = async (name: string, email: string, walletAddress: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      if (
        MOCK_DISTRIBUTORS_DB.some(
          (d) =>
            (d.walletAddress && d.walletAddress.toLowerCase() === walletAddress.toLowerCase()) ||
            (d.email && d.email.toLowerCase() === email.toLowerCase()),
        )
      ) {
        setIsLoading(false)
        return { success: false, message: "钱包地址或邮箱已被注册。" }
      }

      const timestamp = Date.now()
      const newCaptain: Distributor = {
        id: `captain${timestamp}`,
        walletAddress,
        name,
        email,
        role: "distributor",
        roleType: "captain",
        status: "pending", // 船长需要审核
        registrationTimestamp: timestamp,
        registrationDate: formatDate(timestamp),
        referralCode: `${name.substring(0, 3).toUpperCase()}CAP${timestamp.toString().slice(-3)}`,
        uplineDistributorId: undefined, // 船长没有上级
        downlineDistributorIds: [],
        totalPoints: 0,
        personalPoints: 0,
        commissionPoints: 0,
        referredUsers: [],
      }

      MOCK_DISTRIBUTORS_DB = [...MOCK_DISTRIBUTORS_DB, newCaptain]
      updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
      setIsLoading(false)
      return { success: true, message: "船长申请提交成功！请等待管理员审核。" }
    } catch (error) {
      console.error("Captain registration error:", error)
      setIsLoading(false)
      return { success: false, message: "注册过程中发生错误。" }
    }
  }

  const approveDistributor = async (distributorId: string) => {
    MOCK_DISTRIBUTORS_DB = MOCK_DISTRIBUTORS_DB.map((d) => (d.id === distributorId ? { ...d, status: "approved" } : d))
    updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
  }

  const rejectDistributor = async (distributorId: string) => {
    MOCK_DISTRIBUTORS_DB = MOCK_DISTRIBUTORS_DB.map((d) => (d.id === distributorId ? { ...d, status: "rejected" } : d))
    updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
  }

  const adminRegisterOrPromoteCaptain = async (
    name: string,
    email: string,
    walletAddress: string,
    existingId?: string,
  ) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      if (
        !existingId ||
        (existingId &&
          MOCK_DISTRIBUTORS_DB.find((d) => d.id === existingId)?.email?.toLowerCase() !== email?.toLowerCase()) ||
        (existingId &&
          MOCK_DISTRIBUTORS_DB.find((d) => d.id === existingId)?.walletAddress?.toLowerCase() !==
            walletAddress?.toLowerCase())
      ) {
        if (
          MOCK_DISTRIBUTORS_DB.some(
            (d) =>
              d.id !== existingId &&
              (d.walletAddress?.toLowerCase() === walletAddress?.toLowerCase() ||
                d.email?.toLowerCase() === email?.toLowerCase()),
          )
        ) {
          setIsLoading(false)
          return { success: false, message: "钱包地址或邮箱已被其他用户注册。" }
        }
      }

      if (existingId) {
        const userToPromote = MOCK_DISTRIBUTORS_DB.find((d) => d.id === existingId)
        if (!userToPromote) {
          setIsLoading(false)
          return { success: false, message: "未找到要提升的用户。" }
        }

        if (userToPromote.uplineDistributorId) {
          MOCK_DISTRIBUTORS_DB = MOCK_DISTRIBUTORS_DB.map((u) => {
            if (u.id === userToPromote.uplineDistributorId) {
              return {
                ...u,
                downlineDistributorIds: (u.downlineDistributorIds || []).filter((id) => id !== existingId),
              }
            }
            return u
          })
        }

        MOCK_DISTRIBUTORS_DB = MOCK_DISTRIBUTORS_DB.map((d) =>
          d.id === existingId
            ? {
                ...d,
                name,
                email,
                walletAddress,
                roleType: "captain",
                status: "approved",
                uplineDistributorId: undefined,
              }
            : d,
        )
        updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
        setIsLoading(false)
        return { success: true, message: `${name} 已成功提升/更新为船长。` }
      } else {
        const timestamp = Date.now()
        const newCaptain: Distributor = {
          id: `captain${timestamp}`,
          walletAddress,
          name,
          email,
          role: "distributor",
          roleType: "captain",
          status: "approved",
          registrationTimestamp: timestamp,
          registrationDate: formatDate(timestamp),
          referralCode: `${name.substring(0, 3).toUpperCase()}CAP${timestamp.toString().slice(-3)}`,
          uplineDistributorId: undefined,
          downlineDistributorIds: [],
          totalPoints: 0,
          personalPoints: 0,
          commissionPoints: 0,
          referredUsers: [],
        }
        MOCK_DISTRIBUTORS_DB = [...MOCK_DISTRIBUTORS_DB, newCaptain]
        updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
        setIsLoading(false)
        return { success: true, message: `船长 ${name} 注册成功。` }
      }
    } catch (error) {
      console.error("Admin operation error:", error)
      setIsLoading(false)
      return { success: false, message: "操作过程中发生错误。" }
    }
  }

  const getDownlineDetails = useCallback(
    (distributorId: string): Distributor[] => {
      const distributor = allDistributorsData.find((d) => d.id === distributorId)
      if (!distributor) return []
      return distributor.downlineDistributorIds
        .map((downlineId) => allDistributorsData.find((d) => d.id === downlineId))
        .filter(Boolean) as Distributor[]
    },
    [allDistributorsData],
  )

  const addPointsToDistributor = async (distributorId: string, points: number, isDirectEarning: boolean) => {
    try {
      const tempDb = [...MOCK_DISTRIBUTORS_DB]
      const distributorIndex = tempDb.findIndex((d) => d.id === distributorId)
      if (distributorIndex === -1) return
      const distributor = { ...tempDb[distributorIndex] }

      if (isDirectEarning) {
        distributor.personalPoints += points
      }
      distributor.totalPoints += points
      tempDb[distributorIndex] = distributor

      let currentUplineId = distributor.uplineDistributorId
      const pointsForCommission = points

      while (currentUplineId) {
        const uplineIndex = tempDb.findIndex((d) => d.id === currentUplineId)
        if (uplineIndex === -1) break
        const uplineMember = { ...tempDb[uplineIndex] }
        const commissionAmount = Math.floor(pointsForCommission * UPLINE_COMMISSION_RATE)

        if (commissionAmount > 0) {
          uplineMember.commissionPoints += commissionAmount
          uplineMember.totalPoints += commissionAmount
          tempDb[uplineIndex] = uplineMember
        } else {
          break
        }
        currentUplineId = uplineMember.uplineDistributorId
      }
      MOCK_DISTRIBUTORS_DB = tempDb
      updateStateAfterDbChange(MOCK_DISTRIBUTORS_DB, currentUser)
    } catch (error) {
      console.error("Add points error:", error)
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
        addPointsToDistributor,
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
