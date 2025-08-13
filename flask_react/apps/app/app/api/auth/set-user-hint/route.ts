import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@atlas/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Verify the current session
    const session = await auth.api.getSession({ 
      headers: request.headers 
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set the hint cookie with a signed payload containing the user ID
    const response = NextResponse.json({ success: true })
    
    // Set the atlas_user_hint cookie
    response.cookies.set('atlas_user_hint', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      // Set domain for cross-subdomain support if needed
      // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
    })

    return response
  } catch (error) {
    console.error('Error setting user hint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}