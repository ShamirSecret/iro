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
      // 将用户信息注入请求头，供后续路由使用
      req.headers.set('x-user', JSON.stringify(payload));
      return NextResponse.next();
    } catch {
      return new NextResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
}; 