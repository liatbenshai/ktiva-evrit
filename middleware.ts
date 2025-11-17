import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/']
  const publicFiles = ['/manifest.json', '/sw.js', '/favicon.ico']
  const isPublicRoute = publicRoutes.includes(pathname) || 
                        publicFiles.some(file => pathname.startsWith(file)) ||
                        pathname.startsWith('/api/auth') ||
                        pathname.startsWith('/icon-') ||
                        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|json|js)$/i)

  // Check authentication token
  const token = request.cookies.get('auth-token')?.value
  const isAuthenticated = token ? verifyToken(token) : false

  // If trying to access protected route without auth, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login/register, redirect to dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png).*)'],
}
