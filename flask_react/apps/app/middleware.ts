import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup', 
  '/api/auth',
]

// Define API routes that should be allowed without redirect
const apiRoutes = [
  '/api/',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow API routes to pass through
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check for authentication cookie/session
  const authCookie = request.cookies.get('better-auth.session_token')
  
  if (!authCookie) {
    // No auth token found, redirect to app's own signin page
    const signinUrl = new URL('/auth/signin', request.url)
    
    // Add return URL as query parameter if not already on auth page
    if (!pathname.startsWith('/auth/')) {
      signinUrl.searchParams.set('returnUrl', request.url)
    }
    
    return NextResponse.redirect(signinUrl)
  }
  
  // User is authenticated, allow the request
  return NextResponse.next()
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
