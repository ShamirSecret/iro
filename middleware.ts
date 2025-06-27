import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// 公开接口，不需要登录态
const PUBLIC_PATHS = [
  '/api/auth/nonce',
  '/api/auth/verify-signature',
  '/api/distributors/register-captain',
  '/api/distributors/register-crew',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api')) {
    // 公开接口
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    // 外部 Secret 接口
    if (
      pathname === '/api/cron/daily-snapshot' ||
      pathname === '/api/referred-users/update-balance' ||
      pathname === '/api/referred-users/addresses'
    ) {
      return NextResponse.next();
    }
    // 登录态校验
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      console.log("Middleware - JWT payload:", payload);
      
      // 创建新的请求头，包含用户信息
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user', JSON.stringify(payload));
      
      // ADMIN ROLE CHECK: 仅限管理员访问 admin 接口
      if (pathname.startsWith('/api/admin') && (payload as any).role !== 'admin') {
        console.log("Middleware - Blocking admin access for user:", payload);
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      // ADMIN ROLE CHECK: 仅限管理员访问分销商管理接口
      if (pathname.startsWith('/api/distributors/admin-captain') && (payload as any).role !== 'admin') {
        console.log("Middleware - Blocking admin-captain access for user:", payload);
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      
      // ADMIN ROLE CHECK: 仅限管理员访问批准/拒绝/删除接口
      if ((pathname.includes('/approve') || pathname.includes('/reject') || 
           (pathname.match(/\/api\/distributors\/[^\/]+$/) && req.method === 'DELETE')) && 
          (payload as any).role !== 'admin') {
        console.log("Middleware - Blocking approve/reject/delete access for user:", payload);
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
      
      // 创建一个带有修改过的请求头的响应
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return new NextResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
