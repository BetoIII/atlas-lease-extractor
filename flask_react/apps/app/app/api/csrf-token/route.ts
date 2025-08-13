import { NextResponse } from 'next/server'
import { generateCSRFToken } from '../../../lib/csrf'

export async function GET() {
  try {
    const token = generateCSRFToken()
    
    return NextResponse.json({
      csrfToken: token
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}