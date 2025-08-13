import { NextRequest } from 'next/server'
import { randomBytes, createHash } from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-development-secret'

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now().toString()
  const random = randomBytes(16).toString('hex')
  const payload = `${timestamp}:${random}`
  const signature = createHash('sha256')
    .update(payload + CSRF_SECRET)
    .digest('hex')
  
  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [timestamp, random, signature] = decoded.split(':')
    
    if (!timestamp || !random || !signature) {
      return false
    }
    
    // Check token age (15 minutes max)
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > 15 * 60 * 1000) {
      return false
    }
    
    // Verify signature
    const payload = `${timestamp}:${random}`
    const expectedSignature = createHash('sha256')
      .update(payload + CSRF_SECRET)
      .digest('hex')
    
    return signature === expectedSignature
  } catch {
    return false
  }
}

/**
 * Extract CSRF token from request headers or body
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check X-CSRF-Token header first
  const headerToken = request.headers.get('X-CSRF-Token')
  if (headerToken) {
    return headerToken
  }
  
  // For form submissions, token might be in body (handled at route level)
  return null
}