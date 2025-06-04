"use client"

import StatCard from "@/components/dashboard/stat-card" // Reusing StatCard
import { useAuth } from "@/app/providers"
import { Users, UserCheck, Clock, ListChecks } from "lucide-react"

export default function AdminDashboardPage() {
  const { currentUser, allDistributorsData } = useAuth()

  if (!currentUser || currentUser.role !== "admin") return null

  const totalDistributors = allDistributorsData.filter((d) => d.role === "distributor").length
  const pendingApprovals = allDistributorsData.filter((d) => d.role === "distributor" && d.status === "pending").length
  const approvedDistributors = allDistributorsData.filter(
    (d) => d.role === "distributor" && d.status === "approved",
  ).length
  const rejectedDistributors = allDistributorsData.filter(
    (d) => d.role === "distributor" && d.status === "rejected",
  ).length

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gold-DEFAULT">管理员概览</h1>
      <p className="text-gold-light/80">欢迎回来, {currentUser.name}!</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="总注册经销商" value={totalDistributors} icon={Users} description="所有已注册的经销商数量" />
        <StatCard title="待审核申请" value={pendingApprovals} icon={Clock} description="等待管理员批准的申请" />
        <StatCard title="已批准经销商" value={approvedDistributors} icon={UserCheck} description="已通过审核的经销商" />
        <StatCard
          title="已拒绝申请"
          value={rejectedDistributors}
          icon={ListChecks}
          description="已被拒绝的经销商申请"
        />
      </div>

      {/* Placeholder for more admin-specific charts or quick actions */}
      <div className="bg-brandBlack-light border border-gold-dark/50 shadow-md shadow-gold-dark/5 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gold-DEFAULT mb-4">快速操作</h2>
        <p className="text-gold-light/70">您可以在“经销商审核”页面管理新的注册申请。</p>
        {/* Add links or buttons for quick actions if needed */}
      </div>
    </div>
  )
}
