// Shared route definitions to ensure consistency between middleware and layout components
export const PUBLIC_ROUTES = [
  '/',
  '/why-atlas',
  '/why-tokenize',
  '/auth/signin',
  '/auth/signup',
] as const

export const API_ROUTES = [
  '/api/',
] as const

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    // Exact match or match with trailing slash
    return pathname === route || pathname.startsWith(route + '/')
  })
}

export function isApiRoute(pathname: string): boolean {
  return API_ROUTES.some(route => pathname.startsWith(route))
}