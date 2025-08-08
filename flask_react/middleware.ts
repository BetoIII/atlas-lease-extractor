import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/', // Marketing homepage
  '/why-atlas',
  '/why-tokenize',
  '/try-it-now', // Now part of marketing site
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
  
  // TEMPORARILY DISABLED - Allow all routes to pass through
  return NextResponse.next()
  
  // TODO: Re-enable authentication logic later
  /*
  // Allow API routes to pass through
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check for authentication cookie/session
  const authCookie = request.cookies.get('better-auth.session_token')
  
  // Special handling for root path
  if (pathname === '/') {
    if (authCookie) {
      // Authenticated users go to main app
      return NextResponse.redirect(new URL('/try-it-now', request.url))
    }
    // Unauthenticated users see marketing page
    return NextResponse.next()
  }
  
  // Allow public routes for unauthenticated users
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  if (!authCookie) {
    // No auth token found, check for user hint cookie
    const userHintCookie = request.cookies.get('atlas_user_hint')
    
    // Determine redirect destination based on hint cookie presence
    const authUrl = userHintCookie 
      ? new URL('/auth/signin', request.url)   // Known user -> sign in
      : new URL('/auth/signup', request.url)   // New/unknown user -> sign up
    
    // Add return URL as query parameter if not already on auth page
    if (!pathname.startsWith('/auth/')) {
      authUrl.searchParams.set('returnUrl', request.url)
    }
    
    return NextResponse.redirect(authUrl)
  }
  
  // User is authenticated, allow the request
  return NextResponse.next()
  */
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
