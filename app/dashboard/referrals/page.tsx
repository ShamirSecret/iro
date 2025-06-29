"use client"

import { useAuth } from "@/app/providers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function ReferralsPage() {
  const { currentUser } = useAuth()

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gold-DEFAULT">我的推荐</h1>
      <Card className="bg-brandBlack-light border-gold-dark/50 shadow-md shadow-gold-dark/5">
        <CardHeader>
          <CardTitle className="text-gold-DEFAULT flex items-center">
            <Users className="mr-2 h-6 w-6" />
            推荐客户详情
          </CardTitle>
          <CardDescription className="text-gold-light/70">
            通过您的推荐码注册的客户列表及其 WUSD 余额（模拟数据）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser.referredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gold-dark/30 hover:bg-brandBlack-lighter">
                  <TableHead className="text-gold-light">客户地址</TableHead>
                  <TableHead className="text-gold-light text-right">WUSD 余额 (模拟)</TableHead>
                  <TableHead className="text-gold-light text-right">为您赚取的信誉</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUser.referredUsers.map((referral) => (
                  <TableRow key={referral.id} className="border-gold-dark/30 hover:bg-brandBlack-lighter">
                    <TableCell className="font-medium text-gold-light/90">{referral.address}</TableCell>
                    <TableCell className="text-right text-gold-light/90">
                      {referral.wusdBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-gold-DEFAULT font-semibold">
                      {referral.pointsEarned.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gold-light/70 py-8">您还没有推荐任何客户。</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
