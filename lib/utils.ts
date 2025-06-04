import type { Distributor } from "./database"

// 从API获取所有经销商数据
export async function fetchAllDistributors(): Promise<Distributor[]> {
  try {
    const response = await fetch("/api/distributors")
    if (!response.ok) throw new Error("Failed to fetch distributors")
    const data = await response.json()

    // 确保返回的是数组
    if (!Array.isArray(data)) {
      console.error("Invalid data format received:", data)
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching distributors:", error)
    return []
  }
}

// 格式化日期的辅助函数
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return new Date().toLocaleDateString("zh-CN")

  try {
    return new Date(dateString).toLocaleDateString("zh-CN")
  } catch (error) {
    console.error("Date formatting error:", error)
    return new Date().toLocaleDateString("zh-CN")
  }
}

// 生成唯一ID的辅助函数
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 合并类名的辅助函数
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
