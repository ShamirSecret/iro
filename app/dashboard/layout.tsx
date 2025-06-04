import type React from "react"
import DashboardLayoutComponent from "@/components/dashboard/dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
}
