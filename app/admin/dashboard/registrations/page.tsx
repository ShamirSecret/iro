"use client"

import type React from "react"

import { useAuth, type Distributor } from "@/app/providers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Users, Anchor, UserCog, ShieldPlus, Edit3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, type FormEvent } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// StatusBadge and RoleTypeBadge remain the same
const StatusBadge = ({ status }: { status: Distributor["status"] }) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10 text-xs px-2 py-0.5">
          待审核
        </Badge>
      )
    case "approved":
      return (
        <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 text-xs px-2 py-0.5">
          已批准
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10 text-xs px-2 py-0.5">
          已拒绝
        </Badge>
      )
    default:
      return <Badge className="text-xs px-2 py-0.5">未知</Badge>
  }
}

const RoleTypeBadge = ({ roleType }: { roleType: Distributor["role_type"] }) => {
  switch (roleType) {
    case "captain":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs px-2 py-0.5">
          <Anchor className="h-3 w-3 inline mr-1" />
          船长
        </Badge>
      )
    case "crew":
      return (
        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 text-xs px-2 py-0.5">
          <UserCog className="h-3 w-3 inline mr-1" />
          船员
        </Badge>
      )
    default:
      return null
  }
}

// 安全的字符串截取函数
const safeSubstring = (str: string | null | undefined, start: number, end?: number): string => {
  if (!str || typeof str !== "string") return ""
  return end !== undefined ? str.substring(start, end) : str.substring(start)
}

// 安全的钱包地址显示函数
const formatWalletAddress = (address: string | null | undefined): string => {
  if (!address || typeof address !== "string" || address.length < 10) {
    return "无效地址"
  }
  return `${safeSubstring(address, 0, 6)}...${safeSubstring(address, address.length - 4)}`
}

// 安全的名称截取函数
const formatName = (name: string | null | undefined, maxLength = 10): string => {
  if (!name || typeof name !== "string") return "-"
  return name.length > maxLength ? `${safeSubstring(name, 0, maxLength)}...` : name
}

export default function AdminRegistrationsPage() {
  const { allDistributorsData, approveDistributor, rejectDistributor, adminRegisterOrPromoteCaptain, isLoading } =
    useAuth()
  const [filterStatus, setFilterStatus] = useState<Distributor["status"] | "all">("all")
  const [filterRoleType, setFilterRoleType] = useState<Distributor["role_type"] | "all">("all")

  // State for the "Add/Promote Captain" form
  const [captainForm, setCaptainForm] = useState({
    id: "", // For promotion
    name: "",
    email: "",
    walletAddress: "",
  })
  const [isEditingCaptain, setIsEditingCaptain] = useState(false)

  const handleApprove = async (id: string) => {
    if (!id) {
      toast.error("无效的经销商ID")
      return
    }
    await approveDistributor(id)
    toast.success("经销商已批准。")
  }

  const handleReject = async (id: string) => {
    if (!id) {
      toast.error("无效的经销商ID")
      return
    }
    await rejectDistributor(id)
    toast.success("经销商已拒绝。")
  }

  const handleCaptainFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptainForm({ ...captainForm, [e.target.name]: e.target.value })
  }

  const handleCaptainFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!captainForm.name || !captainForm.email || !captainForm.walletAddress) {
      toast.error("请填写船长所有必填信息。")
      return
    }
    const result = await adminRegisterOrPromoteCaptain(
      captainForm.name,
      captainForm.email,
      captainForm.walletAddress,
      isEditingCaptain ? captainForm.id : undefined,
    )
    if (result.success) {
      toast.success(result.message)
      setCaptainForm({ id: "", name: "", email: "", walletAddress: "" }) // Reset form
      setIsEditingCaptain(false)
    } else {
      toast.error(result.message)
    }
  }

  const startPromoteToCaptain = (distributor: Distributor) => {
    if (!distributor || !distributor.id) {
      toast.error("无效的经销商数据")
      return
    }
    setCaptainForm({
      id: distributor.id,
      name: distributor.name || "",
      email: distributor.email || "",
      walletAddress: distributor.wallet_address || "",
    })
    setIsEditingCaptain(true)
    // Scroll to form or open modal might be good UX here
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 安全过滤经销商数据
  const filteredDistributors = (allDistributorsData || [])
    .filter((d) => d && d.role === "distributor") // 确保数据存在且是经销商
    .filter((d) => filterStatus === "all" || d.status === filterStatus)
    .filter((d) => filterRoleType === "all" || d.role_type === filterRoleType)
    .sort((a, b) => (b.registration_timestamp || 0) - (a.registration_timestamp || 0))

  return (
    <div className="space-y-6">
      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <ShieldPlus className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            {isEditingCaptain ? "编辑/提升船长" : "指定新船长"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleCaptainFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="captainName" className="text-xs text-picwe-lightGrayText">
                  名称
                </label>
                <Input
                  id="captainName"
                  name="name"
                  placeholder="船长名称"
                  value={captainForm.name}
                  onChange={handleCaptainFormChange}
                  className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="captainEmail" className="text-xs text-picwe-lightGrayText">
                  邮箱
                </label>
                <Input
                  id="captainEmail"
                  name="email"
                  type="email"
                  placeholder="船长邮箱"
                  value={captainForm.email}
                  onChange={handleCaptainFormChange}
                  className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="captainWalletAddress" className="text-xs text-picwe-lightGrayText">
                  钱包地址
                </label>
                <Input
                  id="captainWalletAddress"
                  name="walletAddress"
                  placeholder="船长钱包地址"
                  value={captainForm.walletAddress}
                  onChange={handleCaptainFormChange}
                  className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              {isEditingCaptain && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingCaptain(false)
                    setCaptainForm({ id: "", name: "", email: "", walletAddress: "" })
                  }}
                  className="text-picwe-lightGrayText border-gray-600 hover:bg-gray-700 text-xs rounded-md h-9"
                >
                  取消编辑
                </Button>
              )}
              <Button
                type="submit"
                className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 text-xs rounded-md h-9 px-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditingCaptain ? (
                  "更新船长信息"
                ) : (
                  "添加新船长"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-xl font-semibold text-white">经销商列表</h1>
        <div className="flex gap-3 flex-wrap">
          <Select
            value={filterRoleType}
            onValueChange={(value: Distributor["role_type"] | "all") => setFilterRoleType(value)}
          >
            <SelectTrigger className="w-full md:w-[160px] bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText text-xs rounded-md focus:ring-picwe-yellow h-9">
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent className="bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText rounded-md">
              <SelectItem value="all" className="text-xs focus:bg-gray-700">
                全部类型
              </SelectItem>
              <SelectItem value="captain" className="text-xs focus:bg-gray-700">
                船长
              </SelectItem>
              <SelectItem value="crew" className="text-xs focus:bg-gray-700">
                船员
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: Distributor["status"] | "all") => setFilterStatus(value)}>
            <SelectTrigger className="w-full md:w-[160px] bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText text-xs rounded-md focus:ring-picwe-yellow h-9">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent className="bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText rounded-md">
              <SelectItem value="all" className="text-xs focus:bg-gray-700">
                全部状态
              </SelectItem>
              <SelectItem value="pending" className="text-xs focus:bg-gray-700">
                待审核
              </SelectItem>
              <SelectItem value="approved" className="text-xs focus:bg-gray-700">
                已批准
              </SelectItem>
              <SelectItem value="rejected" className="text-xs focus:bg-gray-700">
                已拒绝
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-md font-semibold text-white flex items-center">
            <Users className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            经销商列表 ({filteredDistributors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDistributors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-700/50">
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    名称
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    类型
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    钱包
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    上级
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-center">
                    状态
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700/50">
                {filteredDistributors.map((distributor) => {
                  // 安全获取上级信息
                  const upline = distributor.upline_distributor_id
                    ? allDistributorsData.find((d) => d && d.id === distributor.upline_distributor_id)
                    : null

                  return (
                    <TableRow key={distributor.id || Math.random()} className="hover:bg-gray-700/30">
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {distributor.name || "未知用户"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm whitespace-nowrap">
                        <RoleTypeBadge roleType={distributor.role_type} />
                      </TableCell>
                      <TableCell
                        className="px-5 py-3 text-xs text-picwe-lightGrayText font-mono whitespace-nowrap"
                        title={distributor.wallet_address || "无钱包地址"}
                      >
                        {formatWalletAddress(distributor.wallet_address)}
                      </TableCell>
                      <TableCell
                        className="px-5 py-3 text-sm text-picwe-lightGrayText whitespace-nowrap"
                        title={upline?.email || "无上级"}
                      >
                        {upline ? formatName(upline.name) : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-center">
                        <StatusBadge status={distributor.status} />
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right space-x-1">
                        {distributor.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-400 hover:bg-green-500/20 hover:text-green-300 text-xs px-2 py-1 h-7"
                              onClick={() => handleApprove(distributor.id)}
                              disabled={isLoading}
                              title="批准"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs px-2 py-1 h-7"
                              onClick={() => handleReject(distributor.id)}
                              disabled={isLoading}
                              title="拒绝"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {distributor.role_type === "crew" && distributor.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 text-xs px-2 py-1 h-7"
                            onClick={() => startPromoteToCaptain(distributor)}
                            disabled={isLoading}
                            title="提升为船长"
                          >
                            <Anchor className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {distributor.role_type === "captain" && distributor.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 text-xs px-2 py-1 h-7"
                            onClick={() => startPromoteToCaptain(distributor)}
                            disabled={isLoading}
                            title="编辑船长信息"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-picwe-lightGrayText">暂无符合条件的经销商。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
