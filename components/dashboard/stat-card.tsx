import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export default function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="bg-brandBlack-light border-gold-dark/50 shadow-md shadow-gold-dark/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gold-light/80">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gold-DEFAULT" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gold-DEFAULT">{value}</div>
        {description && <p className="text-xs text-gold-light/60 pt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
