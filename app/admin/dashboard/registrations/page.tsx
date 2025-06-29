"use client"

import type React from "react"

import { useAuth, useLanguage } from "@/app/providers"
import type { Distributor } from "@/lib/database"
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
import { Trash2 } from "lucide-react"

// StatusBadge and RoleTypeBadge remain the same
const StatusBadge = ({ status }: { status: Distributor["status"] }) => {
  const { language } = useLanguage()
  
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10 text-xs px-2 py-0.5">
          {language === "zh" ? "待审核" : "Pending"}
        </Badge>
      )
    case "approved":
      return (
        <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 text-xs px-2 py-0.5">
          {language === "zh" ? "已批准" : "Approved"}
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10 text-xs px-2 py-0.5">
          {language === "zh" ? "已拒绝" : "Rejected"}
        </Badge>
      )
    default:
      return <Badge className="text-xs px-2 py-0.5">{language === "zh" ? "未知" : "Unknown"}</Badge>
  }
}

// 简化的RoleTypeBadge组件，直接基于roleType显示头衔
const RoleTypeBadge = ({ distributor }: { distributor: Distributor }) => {
  const { language } = useLanguage()
  
  // 直接基于roleType决定头衔，无需复杂的计算
  const isCaptain = distributor.roleType === "captain"
  const title = language === "zh" ? (isCaptain ? "船长" : "船员") : (isCaptain ? "Captain" : "Crew")
  const icon = isCaptain ? <Anchor className="h-3 w-3 inline mr-1" /> : <UserCog className="h-3 w-3 inline mr-1" />
  const color = isCaptain ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-gray-500/20 text-gray-400 border-gray-500/50"
  
  return (
    <Badge className={`${color} border text-xs px-2 py-0.5`}>
      {icon}
      {title}
    </Badge>
  )
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
  const { allDistributorsData, approveDistributor, rejectDistributor, adminRegisterOrPromoteCaptain, deleteDistributor, updateDistributorInfo, isLoading } =
    useAuth()
  const { language } = useLanguage()
  
  // 简化状态管理，移除重复的filterTitle
  const [filterStatus, setFilterStatus] = useState<Distributor["status"] | "all">("all")
  const [filterRoleType, setFilterRoleType] = useState<Distributor["roleType"] | "all">("all")

  // State for editing distributor info
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    walletAddress: "", // 只用于显示，不能修改
  })
  const [isEditing, setIsEditing] = useState(false)
  
  // State for adding new captain
  const [captainForm, setCaptainForm] = useState({
    name: "",
    email: "",
    walletAddress: "",
  })
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleApprove = async (id: string) => {
    if (!id) {
      toast.error(language === "zh" ? "无效的船员ID" : "Invalid crew ID")
      return
    }
    const result = await approveDistributor(id)
    if (result.success) {
      toast.success(language === "zh" ? "船员已批准。" : "Crew member approved.")
    } else {
      toast.error(result.message || (language === "zh" ? "批准失败" : "Approval failed"))
    }
  }

  const handleReject = async (id: string) => {
    if (!id) {
      toast.error(language === "zh" ? "无效的船员ID" : "Invalid crew ID")
      return
    }
    const result = await rejectDistributor(id)
    if (result.success) {
      toast.success(language === "zh" ? "船员已拒绝。" : "Crew member rejected.")
    } else {
      toast.error(result.message || (language === "zh" ? "拒绝失败" : "Rejection failed"))
    }
  }

  const handleCaptainFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptainForm({ ...captainForm, [e.target.name]: e.target.value })
  }
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleCaptainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captainForm.name || !captainForm.email || !captainForm.walletAddress) {
      setMessage({ text: language === "zh" ? "请填写所有必填字段" : "Please fill in all required fields", type: "error" })
      return
    }

    // 将钱包地址转换为小写，确保数据库中地址格式一致
    const normalizedWalletAddress = captainForm.walletAddress.toLowerCase()

    const result = await adminRegisterOrPromoteCaptain(
      captainForm.name,
      captainForm.email,
      normalizedWalletAddress,
    )

    if (result.success) {
      setMessage({ text: result.message || (language === "zh" ? "船长注册成功" : "Captain registered successfully"), type: "success" })
      setCaptainForm({ name: "", email: "", walletAddress: "" })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ text: result.message || (language === "zh" ? "船长注册失败" : "Captain registration failed"), type: "error" })
    }
  }
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.name || !editForm.email) {
      setMessage({ text: language === "zh" ? "请填写所有必填字段" : "Please fill in all required fields", type: "error" })
      return
    }

    const result = await updateDistributorInfo(editForm.id, editForm.name, editForm.email)

    if (result.success) {
      setMessage({ text: result.message || (language === "zh" ? "信息更新成功" : "Information updated successfully"), type: "success" })
      setEditForm({ id: "", name: "", email: "", walletAddress: "" })
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ text: result.message || (language === "zh" ? "信息更新失败" : "Information update failed"), type: "error" })
    }
  }

  const startEditDistributor = (distributor: Distributor) => {
    if (!distributor || !distributor.id) {
      toast.error(language === "zh" ? "无效的用户数据" : "Invalid user data")
      return
    }
    setEditForm({
      id: distributor.id,
      name: distributor.name || "",
      email: distributor.email || "",
      walletAddress: distributor.walletAddress || "",
    })
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 删除船员处理函数
  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error(language === "zh" ? "无效的船员ID" : "Invalid crew ID")
      return
    }
    const result = await deleteDistributor(id)
    if (result.success) {
      toast.success(language === "zh" ? "船员已删除。" : "Crew member deleted.")
    } else {
      toast.error(result.message || (language === "zh" ? "删除失败" : "Deletion failed"))
    }
  }

  // 简化过滤逻辑，移除重复的filterTitle筛选
  const filteredDistributors = (allDistributorsData || [])
    .filter((d) => d && d.role === "distributor") // 确保数据存在且是船员（分销角色）
    .filter((d) => filterStatus === "all" || d.status === filterStatus)
    .filter((d) => filterRoleType === "all" || d.roleType === filterRoleType)
    .sort((a, b) => (b.registrationTimestamp || 0) - (a.registrationTimestamp || 0))

  return (
    <div className="space-y-6">
      {/* 编辑用户信息表单 */}
      {isEditing && (
        <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
          <CardHeader className="p-5 border-b border-gray-700/50">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Edit3 className="mr-2.5 h-5 w-5 text-picwe-yellow" />
              {language === "zh" ? "编辑用户信息" : "Edit User Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="editName" className="text-xs text-picwe-lightGrayText">
                    {language === "zh" ? "名称" : "Name"}
                  </label>
                  <Input
                    id="editName"
                    name="name"
                    placeholder={language === "zh" ? "用户名称" : "User Name"}
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editEmail" className="text-xs text-picwe-lightGrayText">
                    {language === "zh" ? "邮箱" : "Email"}
                  </label>
                  <Input
                    id="editEmail"
                    name="email"
                    type="email"
                    placeholder={language === "zh" ? "用户邮箱" : "User Email"}
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editWalletAddress" className="text-xs text-picwe-lightGrayText">
                    {language === "zh" ? "钱包地址（不可修改）" : "Wallet Address (Read-only)"}
                  </label>
                  <Input
                    id="editWalletAddress"
                    name="walletAddress"
                    value={editForm.walletAddress}
                    className="bg-picwe-black border-gray-700 text-gray-500 text-sm rounded-md h-9 mt-1"
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({ id: "", name: "", email: "", walletAddress: "" })
                  }}
                  className="text-picwe-lightGrayText border-gray-600 hover:bg-gray-700 text-xs rounded-md h-9"
                >
                  {language === "zh" ? "取消编辑" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 text-xs rounded-md h-9 px-4"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "zh" ? "更新信息" : "Update Info")}
                </Button>
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
            </form>
          </CardContent>
        </Card>
      )}

      {/* 添加新船长表单 */}
      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <ShieldPlus className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            {language === "zh" ? "指定新船长" : "Add New Captain"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleCaptainSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="captainName" className="text-xs text-picwe-lightGrayText">
                  {language === "zh" ? "名称" : "Name"}
                </label>
                <Input
                  id="captainName"
                  name="name"
                  placeholder={language === "zh" ? "船长名称" : "Captain Name"}
                  value={captainForm.name}
                  onChange={handleCaptainFormChange}
                  className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="captainEmail" className="text-xs text-picwe-lightGrayText">
                  {language === "zh" ? "邮箱" : "Email"}
                </label>
                <Input
                  id="captainEmail"
                  name="email"
                  type="email"
                  placeholder={language === "zh" ? "船长邮箱" : "Captain Email"}
                  value={captainForm.email}
                  onChange={handleCaptainFormChange}
                  className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="captainWalletAddress" className="text-xs text-picwe-lightGrayText">
                  {language === "zh" ? "钱包地址" : "Wallet Address"}
                </label>
                <Input
                  id="captainWalletAddress"
                  name="walletAddress"
                  placeholder={language === "zh" ? "船长钱包地址" : "Captain Wallet Address"}
                  value={captainForm.walletAddress}
                  onChange={handleCaptainFormChange}
                  className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="submit"
                className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 text-xs rounded-md h-9 px-4"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "zh" ? "添加新船长" : "Add New Captain")}
              </Button>
            </div>
            {!isEditing && message && (
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
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-xl font-semibold text-white">{language === "zh" ? "船员列表" : "Crew List"}</h1>
        {/* 简化筛选器，移除重复的filterTitle */}
        <div className="flex gap-3 flex-wrap">
          <Select
            value={filterRoleType}
            onValueChange={(value: Distributor["roleType"] | "all") => setFilterRoleType(value)}
          >
            <SelectTrigger className="w-full md:w-[160px] bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText text-xs rounded-md focus:ring-picwe-yellow h-9">
              <SelectValue placeholder={language === "zh" ? "筛选类型" : "Filter Type"} />
            </SelectTrigger>
            <SelectContent className="bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText rounded-md">
              <SelectItem value="all" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "全部类型" : "All Types"}
              </SelectItem>
              <SelectItem value="captain" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "船长" : "Captain"}
              </SelectItem>
              <SelectItem value="crew" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "船员" : "Crew"}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: Distributor["status"] | "all") => setFilterStatus(value)}>
            <SelectTrigger className="w-full md:w-[160px] bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText text-xs rounded-md focus:ring-picwe-yellow h-9">
              <SelectValue placeholder={language === "zh" ? "筛选状态" : "Filter Status"} />
            </SelectTrigger>
            <SelectContent className="bg-picwe-darkGray border-gray-700 text-picwe-lightGrayText rounded-md">
              <SelectItem value="all" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "全部状态" : "All Status"}
              </SelectItem>
              <SelectItem value="pending" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "待审核" : "Pending"}
              </SelectItem>
              <SelectItem value="approved" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "已批准" : "Approved"}
              </SelectItem>
              <SelectItem value="rejected" className="text-xs focus:bg-gray-700">
                {language === "zh" ? "已拒绝" : "Rejected"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-md font-semibold text-white flex items-center">
            <Users className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            {language === "zh" ? "船员列表" : "Crew List"} ({filteredDistributors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDistributors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-700/50">
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    {language === "zh" ? "名称" : "Name"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    {language === "zh" ? "头衔" : "Title"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    {language === "zh" ? "钱包" : "Wallet"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    {language === "zh" ? "上级" : "Upline"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-center">
                    {language === "zh" ? "状态" : "Status"}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-right">
                    {language === "zh" ? "操作" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700/50">
                {filteredDistributors.map((distributor) => {
                  // 安全获取上级信息
                  const upline = distributor.uplineDistributorId
                    ? allDistributorsData.find((d) => d && d.id === distributor.uplineDistributorId)
                    : null

                  return (
                    <TableRow key={distributor.id || Math.random()} className="hover:bg-gray-700/30">
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {distributor.name || "未知用户"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm whitespace-nowrap">
                        <RoleTypeBadge distributor={distributor} />
                      </TableCell>
                      <TableCell
                        className="px-5 py-3 text-xs text-picwe-lightGrayText font-mono whitespace-nowrap"
                        title={distributor.walletAddress || "无钱包地址"}
                      >
                        {formatWalletAddress(distributor.walletAddress)}
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
                              title={language === "zh" ? "批准" : "Approve"}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs px-2 py-1 h-7"
                              onClick={() => handleReject(distributor.id)}
                              disabled={isLoading}
                              title={language === "zh" ? "拒绝" : "Reject"}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {distributor.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 text-xs px-2 py-1 h-7"
                            onClick={() => startEditDistributor(distributor)}
                            disabled={isLoading}
                            title={language === "zh" ? "编辑信息" : "Edit Info"}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {/* 合并删除按钮逻辑，无论是crew还是captain都可以删除 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs px-2 py-1 h-7"
                          onClick={() => handleDelete(distributor.id)}
                          disabled={isLoading}
                          title={language === "zh" ? "删除" : "Delete"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-picwe-lightGrayText">{language === "zh" ? "暂无符合条件的船员。" : "No crew members match the criteria."}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
