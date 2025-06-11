"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { useAuth } from "@/app/providers"
import type { Distributor } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, UserPlus, Trash2, Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function AdminsManagementPage() {
  const { allDistributorsData, isLoading, addAdmin, updateAdmin, deleteAdmin } = useAuth()
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [isEditingAdmin, setIsEditingAdmin] = useState(false)
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    walletAddress: "",
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<Distributor | null>(null)

  // 过滤出所有管理员
  const adminUsers = allDistributorsData.filter((user) => user.role === "admin")

  const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value })
  }

  const handleAddAdmin = async (e: FormEvent) => {
    e.preventDefault()

    if (!adminForm.name || !adminForm.email || !adminForm.walletAddress) {
      toast.error("请填写所有必填信息")
      return
    }

    try {
      const result = await addAdmin(adminForm.name, adminForm.email, adminForm.walletAddress)
      if (result.success) {
        toast.success(result.message)
        setAdminForm({ name: "", email: "", walletAddress: "" })
        setIsAddingAdmin(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("添加管理员失败")
      console.error("添加管理员错误:", error)
    }
  }

  const handleEditAdmin = async (e: FormEvent) => {
    e.preventDefault()

    if (!adminForm.name || !adminForm.email || !adminForm.walletAddress) {
      toast.error("请填写所有必填信息")
      return
    }

    try {
      const result = await updateAdmin(selectedAdminId as string, adminForm.name, adminForm.email, adminForm.walletAddress)
      if (result.success) {
        toast.success(result.message)
        setAdminForm({ name: "", email: "", walletAddress: "" })
        setIsEditingAdmin(false)
        setSelectedAdminId(null)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("更新管理员失败")
      console.error("更新管理员错误:", error)
    }
  }

  const startEditAdmin = (admin: Distributor) => {
    setAdminForm({
      name: admin.name || "",
      email: admin.email || "",
      walletAddress: admin.walletAddress || "",
    })
    setSelectedAdminId(admin.id)
    setIsEditingAdmin(true)
    setIsAddingAdmin(false)
  }

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return

    try {
      const result = await deleteAdmin(adminToDelete.id)
      if (result.success) {
        toast.success(`管理员 ${adminToDelete.name} 已删除`)
        setIsDeleteDialogOpen(false)
        setAdminToDelete(null)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("删除管理员失败")
      console.error("删除管理员错误:", error)
    }
  }

  const startDeleteAdmin = (admin: Distributor) => {
    setAdminToDelete(admin)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">管理员管理</h1>
        <Button
          onClick={() => {
            setIsAddingAdmin(true)
            setIsEditingAdmin(false)
            setAdminForm({ name: "", email: "", walletAddress: "" })
          }}
          className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          添加管理员
        </Button>
      </div>

      {(isAddingAdmin || isEditingAdmin) && (
        <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
          <CardHeader className="p-5 border-b border-gray-700/50">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Shield className="mr-2.5 h-5 w-5 text-picwe-yellow" />
              {isEditingAdmin ? "编辑管理员" : "添加新管理员"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={isEditingAdmin ? handleEditAdmin : handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="adminName" className="text-xs text-picwe-lightGrayText">
                    名称
                  </label>
                  <Input
                    id="adminName"
                    name="name"
                    placeholder="管理员名称"
                    value={adminForm.name}
                    onChange={handleAdminFormChange}
                    className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="adminEmail" className="text-xs text-picwe-lightGrayText">
                    邮箱
                  </label>
                  <Input
                    id="adminEmail"
                    name="email"
                    type="email"
                    placeholder="管理员邮箱"
                    value={adminForm.email}
                    onChange={handleAdminFormChange}
                    className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="adminWalletAddress" className="text-xs text-picwe-lightGrayText">
                    钱包地址
                  </label>
                  <Input
                    id="adminWalletAddress"
                    name="walletAddress"
                    placeholder="管理员钱包地址"
                    value={adminForm.walletAddress}
                    onChange={handleAdminFormChange}
                    className="bg-picwe-black border-gray-700 text-white text-sm rounded-md h-9 mt-1"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingAdmin(false)
                    setIsEditingAdmin(false)
                    setSelectedAdminId(null)
                  }}
                  className="text-picwe-lightGrayText border-gray-600 hover:bg-gray-700 text-xs rounded-md h-9"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 text-xs rounded-md h-9 px-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEditingAdmin ? (
                    "更新管理员"
                  ) : (
                    "添加管理员"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-md font-semibold text-white flex items-center">
            <Shield className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            管理员列表 ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {adminUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-700/50">
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    名称
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    邮箱
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    钱包地址
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                    角色
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700/50">
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-gray-700/30">
                    <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                      {admin.name || "未命名管理员"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-picwe-lightGrayText whitespace-nowrap">
                      {admin.email || "无邮箱"}
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 text-xs text-picwe-lightGrayText font-mono whitespace-nowrap"
                      title={admin.walletAddress}
                    >
                      {admin.walletAddress
                        ? `${admin.walletAddress.substring(0, 6)}...${admin.walletAddress.substring(
                            admin.walletAddress.length - 4,
                          )}`
                        : "无钱包地址"}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50 text-xs px-2 py-0.5">
                        <Shield className="h-3 w-3 inline mr-1" />
                        管理员
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 text-xs px-2 py-1 h-7"
                        onClick={() => startEditAdmin(admin)}
                        title="编辑"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs px-2 py-1 h-7"
                        onClick={() => startDeleteAdmin(admin)}
                        title="删除"
                        disabled={admin.walletAddress === "0x442368f7b5192f9164a11a5387194cb5718673b9"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-picwe-lightGrayText">暂无管理员。</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-picwe-darkGray border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>确认删除管理员</DialogTitle>
            <DialogDescription className="text-picwe-lightGrayText">
              您确定要删除管理员 {adminToDelete?.name || "未命名管理员"} 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-600 text-picwe-lightGrayText hover:bg-gray-700"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAdmin}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
