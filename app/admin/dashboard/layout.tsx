import type React from "react"
import AdminDashboardLayoutComponent from "@/components/admin/admin-dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardLayoutComponent>{children}</AdminDashboardLayoutComponent>
}
