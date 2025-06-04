"use client"

import { useState } from "react"
import { useAuth } from "@/app/providers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User, Mail, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DistributorSearchPage() {
  const { allDistributorsData } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"name" | "email" | "wallet">("name")
  const [searchResults, setSearchResults] = useState<typeof allDistributorsData>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    let results

    switch (searchType) {
      case "name":
        results = allDistributorsData.filter((d) => d.name.toLowerCase().includes(query))
        break
      case "email":
        results = allDistributorsData.filter((d) => d.email.toLowerCase().includes(query))
        break
      case "wallet":
        results = allDistributorsData.filter((d) => d.walletAddress.toLowerCase().includes(query))
        break
      default:
        results = []
    }

    setSearchResults(results)
    setHasSearched(true)
  }

  // Update return statement for styling
  return (
    <div className="space-y-6">
      <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
        <CardHeader className="p-5 border-b border-gray-700/50">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Search className="mr-2.5 h-5 w-5 text-picwe-yellow" />
            经销商查询
          </CardTitle>
          <CardDescription className="text-sm text-picwe-lightGrayText mt-1">
            通过名称、邮箱或钱包地址查询经销商信息
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <Tabs defaultValue="name" onValueChange={(v) => setSearchType(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 mb-5 bg-picwe-black rounded-lg p-1">
              {/* TabsTrigger styling adjusted */}
              <TabsTrigger
                value="name"
                className="text-xs font-medium py-2 data-[state=active]:bg-picwe-yellow data-[state=active]:text-picwe-black data-[state=active]:shadow-md text-picwe-lightGrayText rounded-md"
              >
                <User className="h-4 w-4 mr-1.5" /> 按名称
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="text-xs font-medium py-2 data-[state=active]:bg-picwe-yellow data-[state=active]:text-picwe-black data-[state=active]:shadow-md text-picwe-lightGrayText rounded-md"
              >
                <Mail className="h-4 w-4 mr-1.5" /> 按邮箱
              </TabsTrigger>
              <TabsTrigger
                value="wallet"
                className="text-xs font-medium py-2 data-[state=active]:bg-picwe-yellow data-[state=active]:text-picwe-black data-[state=active]:shadow-md text-picwe-lightGrayText rounded-md"
              >
                <Wallet className="h-4 w-4 mr-1.5" /> 按钱包地址
              </TabsTrigger>
            </TabsList>

            <div className="flex space-x-3">
              <Input
                placeholder={`输入${searchType === "name" ? "名称" : searchType === "email" ? "邮箱" : "钱包地址"}关键词...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-picwe-black border-gray-700 text-white placeholder-gray-500 rounded-lg py-2.5 text-sm focus:ring-picwe-yellow focus:border-picwe-yellow"
              />
              <Button
                onClick={handleSearch}
                className="bg-picwe-yellow text-picwe-black hover:bg-yellow-400 rounded-lg text-sm font-medium px-5 py-2.5"
              >
                <Search className="h-4 w-4 mr-2" /> 查询
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card className="bg-picwe-darkGray rounded-xl shadow-xl border-gray-700/50">
          <CardHeader className="p-5 border-b border-gray-700/50">
            <CardTitle className="text-md font-semibold text-white">查询结果</CardTitle>
            <CardDescription className="text-sm text-picwe-lightGrayText mt-1">
              {searchResults.length > 0 ? `找到 ${searchResults.length} 个匹配结果` : "未找到匹配结果"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {" "}
            {/* Remove padding for table to span full width */}
            {searchResults.length > 0 ? (
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
                      注册日期
                    </TableHead>
                    <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider">
                      状态
                    </TableHead>
                    <TableHead className="px-5 py-3 text-xs font-medium text-picwe-lightGrayText uppercase tracking-wider text-right">
                      积分
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-700/50">
                  {searchResults.map((distributor) => (
                    <TableRow key={distributor.id} className="hover:bg-gray-700/30">
                      <TableCell className="px-5 py-3 text-sm text-white whitespace-nowrap">
                        {distributor.name}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-picwe-lightGrayText whitespace-nowrap">
                        {distributor.email}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-picwe-lightGrayText font-mono whitespace-nowrap">
                        {distributor.walletAddress.substring(0, 6)}...
                        {distributor.walletAddress.substring(distributor.walletAddress.length - 4)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-picwe-lightGrayText whitespace-nowrap">
                        {distributor.registrationDate}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm whitespace-nowrap">
                        {getStatusBadge(distributor.status)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-picwe-yellow font-semibold whitespace-nowrap text-right">
                        {distributor.totalPoints.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-picwe-lightGrayText">未找到匹配 "{searchQuery}" 的经销商</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// getStatusBadge function remains the same
const getStatusBadge = (status: string) => {
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
