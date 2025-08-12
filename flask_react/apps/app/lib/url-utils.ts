// Utility functions for safe URL handling

const ALLOWED_DOMAINS = [
  'x.com',
  'twitter.com',
  'linkedin.com',
  'github.com',
  'atlasdata.coop',
] as const

/**
 * Validates if a URL is safe for external linking
 * @param url - The URL to validate
 * @returns boolean indicating if URL is safe
 */
export function isValidExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') {
      return false
    }
    
    // Check if domain is in allowlist
    const hostname = parsedUrl.hostname.toLowerCase()
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Sanitizes external URL for safe usage
 * @param url - The URL to sanitize
 * @returns sanitized URL or null if invalid
 */
export function sanitizeExternalUrl(url: string): string | null {
  if (!isValidExternalUrl(url)) {
    return null
  }
  
  return url
}

/**
 * Gets safe external link props for Next.js Link components
 * @param href - The URL to link to
 * @returns props object with href, target, and rel attributes or null if invalid
 */
export function getSafeExternalLinkProps(href: string) {
  const sanitizedUrl = sanitizeExternalUrl(href)
  
  if (!sanitizedUrl) {
    console.warn(`Invalid external URL blocked: ${href}`)
    return null
  }
  
  return {
    href: sanitizedUrl,
    target: '_blank',
    rel: 'noopener noreferrer',
  }
}