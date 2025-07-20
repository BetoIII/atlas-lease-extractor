import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
