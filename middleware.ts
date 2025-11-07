export { default } from 'next-auth/middleware'

export const config = {
  // Note: /admin page is NOT protected here because it has its own login form
  // The admin page handles authentication internally
  matcher: ['/dashboard/:path*', '/api/user/:path*', '/api/checkins/:path*', '/api/ai/:path*', '/api/admin/:path*'],
}

