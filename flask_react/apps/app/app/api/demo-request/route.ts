import { NextRequest, NextResponse } from 'next/server'
import { validateCSRFToken, extractCSRFToken } from '../../../lib/csrf'

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfToken = extractCSRFToken(request)
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, company, csrfToken: bodyToken } = body
    
    // Also check CSRF token from body as fallback
    if (!csrfToken && bodyToken && !validateCSRFToken(bodyToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send notification email
    // 3. Add to CRM/marketing system
    
    // For now, just log and return success
    console.log('Demo request received:', { name, email, company })
    
    return NextResponse.json({
      message: 'Demo request submitted successfully',
      status: 'success'
    })
  } catch (error) {
    console.error('Error processing demo request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}