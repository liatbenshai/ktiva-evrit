import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token - NextAuth v5 will automatically detect the cookie name
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });
  
  // Debug: Log token status for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    console.log('[Middleware] Dashboard route - token exists:', !!token);
    if (!token) {
      console.log('[Middleware] No token found, checking cookies...');
      const cookies = request.cookies.getAll();
      console.log('[Middleware] Available cookies:', cookies.map(c => c.name));
      
      // Check for session cookies
      const secureCookie = request.cookies.get('__Secure-authjs.session-token');
      const regularCookie = request.cookies.get('authjs.session-token');
      console.log('[Middleware] Secure cookie exists:', !!secureCookie);
      console.log('[Middleware] Regular cookie exists:', !!regularCookie);
      
      if (!process.env.NEXTAUTH_SECRET) {
        console.error('[Middleware] CRITICAL: NEXTAUTH_SECRET is not set!');
      }
    }
  }

  // Allow access to login page, create-admin page, debug page and public files
  if (
    pathname === '/login' || 
    pathname === '/admin/create-admin' ||
    pathname === '/admin/debug-auth' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/sw.js')
  ) {
    return NextResponse.next();
  }

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // Check if there's a session cookie that might not have been decoded
      // This usually means NEXTAUTH_SECRET mismatch
      const sessionCookie = request.cookies.get('__Secure-authjs.session-token') || 
                           request.cookies.get('authjs.session-token');
      
      if (sessionCookie && !process.env.NEXTAUTH_SECRET) {
        console.error('[Middleware] CRITICAL: NEXTAUTH_SECRET is not set!');
      } else if (sessionCookie) {
        console.error('[Middleware] Session cookie exists but token is null - NEXTAUTH_SECRET mismatch!');
        console.error('[Middleware] Cookie name:', sessionCookie.name);
        console.error('[Middleware] Cookie value length:', sessionCookie.value?.length || 0);
      }
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists, allow access
    return NextResponse.next();
  }

  // Protect admin routes - require authentication and admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is admin (only admin@ktiva-evrit.com can access admin routes)
    const userEmail = token.email as string | undefined;
    const isAdmin = userEmail === 'admin@ktiva-evrit.com';
    
    if (!isAdmin) {
      // Redirect non-admin users to dashboard
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-.*\\.png).*)'],
}
