"use client"

// import { useDistributorData } from "@/app/providers" // Remove this
import { useAuth } from "@/app/providers" // Use this
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Trophy, Loader2 } from "lucide-react"
// Removed duplicate Loader2 import, already imported from lucide-react

export default function RankingPage() {
  const { allDistributorsData, isLoading: authIsLoading, currentUser } = useAuth()

  // Filter and sort for display on the ranking page (approved distributors, sorted by rank)
  const rankedDisplayList = allDistributorsData
    .filter((d) => d.role === "distributor" && d.status === "approved")
    .sort((a, b) => (a.rank ?? Number.POSITIVE_INFINITY) - (b.rank ?? Number.POSITIVE_INFINITY))

  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-gold-DEFAULT" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gold-DEFAULT">经销商排行榜</h1>
      <Card className="bg-brandBlack-light border-gold-dark/50 shadow-md shadow-gold-dark/5">
        <CardHeader>
          <CardTitle className="text-gold-DEFAULT flex items-center">
            <BarChart3 className="mr-2 h-6 w-6" />
            排行榜
          </CardTitle>
          <CardDescription className="text-gold-light/70">根据总积分对经销商进行排名。</CardDescription>
        </CardHeader>
        <CardContent>
          {rankedDisplayList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gold-dark/30 hover:bg-brandBlack-lighter">
                  <TableHead className="text-gold-light w-[80px]">排名</TableHead>
                  <TableHead className="text-gold-light">经销商名称</TableHead>
                  <TableHead className="text-gold-light text-right">总积分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedDisplayList.map((distributor, index) => (
                  <TableRow
                    key={distributor.id}
                    className={`border-gold-dark/30 hover:bg-brandBlack-lighter ${currentUser?.id === distributor.id ? "bg-gold-dark/10" : ""}`}
                  >
                    <TableCell className="font-semibold text-xl text-gold-DEFAULT">
                      {distributor.rank === 1 && <Trophy className="inline-block h-5 w-5 mr-1 text-yellow-400" />}
                      {distributor.rank === 2 && <Trophy className="inline-block h-5 w-5 mr-1 text-slate-400" />}
                      {distributor.rank === 3 && <Trophy className="inline-block h-5 w-5 mr-1 text-yellow-700" />}
                      {distributor.rank || "N/A"}
                    </TableCell>
                    <TableCell
                      className={`font-medium ${currentUser?.id === distributor.id ? "text-gold-DEFAULT" : "text-gold-light/90"}`}
                    >
                      {distributor.name}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${currentUser?.id === distributor.id ? "text-gold-DEFAULT" : "text-gold-light/90"}`}
                    >
                      {distributor.totalPoints.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gold-light/70 py-8">排行榜上暂无经销商数据。</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
