export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/user/:path*', '/api/checkins/:path*', '/api/ai/:path*', '/api/admin/:path*'],
}

