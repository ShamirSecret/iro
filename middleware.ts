import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 第三方服务接口使用 Secret 鉴权
  if (
    pathname.startsWith("/api/referred-users/update-balance") ||
    pathname.startsWith("/api/cron/daily-snapshot")
  ) {
    const authHeader = req.headers.get("Authorization")
    const expectedSecret = pathname.startsWith("/api/referred-users/update-balance")
      ? process.env.BALANCE_UPDATE_SECRET
      : process.env.CRON_SECRET
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }
    return NextResponse.next()
  }

  // 前端用户/管理员接口使用 NextAuth JWT 鉴权
  if (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/distributors/admin-captain") ||
    pathname.startsWith("/api/distributors/add-points") ||
    /^\/api\/distributors\/[^\/]+\/(approve|reject)/.test(pathname)
  ) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }
    // 管理相关接口进一步校验 admin 角色
    if (
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/distributors/admin-captain") ||
      /^\/api\/distributors\/[^\/]+\/(approve|reject)/.test(pathname)
    ) {
      if ((token as any).role !== "admin") {
        return new NextResponse(JSON.stringify({ error: "无权限" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        })
      }
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/referred-users/update-balance",
    "/api/cron/daily-snapshot",
    "/api/admin/:path*",
    "/api/distributors/admin-captain",
    "/api/distributors/add-points",
    "/api/distributors/:id/approve",
    "/api/distributors/:id/reject",
  ],
} 