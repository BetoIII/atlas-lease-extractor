# Atlas Data Co-op Microfrontend Deployment Guide

## Overview

Atlas Data Co-op consists of two separate microfrontends:
- **Marketing**: Public-facing website (`atlasdata.coop`)
- **App**: Authenticated application (`app.atlasdata.coop`)

## Prerequisites

1. **Vercel CLI**: `npm i -g vercel`
2. **PNPM**: `npm i -g pnpm`
3. **Database**: PostgreSQL instance (for app microfrontend)

## Environment Variables

### Marketing Microfrontend
```bash
NEXT_PUBLIC_APP_URL=https://app.atlasdata.coop
NEXT_PUBLIC_MARKETING_URL=https://atlasdata.coop
NODE_ENV=production
```

### App Microfrontend
```bash
NEXT_PUBLIC_MARKETING_URL=https://atlasdata.coop
NEXT_PUBLIC_APP_URL=https://app.atlasdata.coop
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-super-secret-key
BETTER_AUTH_URL=https://app.atlasdata.coop
NODE_ENV=production
```

## Deployment Commands

### Build and Deploy All
```bash
# From root directory
pnpm run build:packages  # Build shared packages first
pnpm run deploy:all      # Deploy both microfrontends
```

### Deploy Individual Microfrontends
```bash
# Marketing only
pnpm run deploy:marketing

# App only  
pnpm run deploy:app
```

### Local Development
```bash
# Run both microfrontends in parallel
pnpm run dev:all

# Or run individually
pnpm run dev:marketing  # Port 3001
pnpm run dev:app        # Port 3000
```

## Vercel Configuration

### Marketing (atlasdata.coop)
- **Project**: `atlas-marketing`
- **Domain**: `atlasdata.coop`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Node Version**: 18.x

### App (app.atlasdata.coop)
- **Project**: `atlas-app`
- **Domain**: `app.atlasdata.coop`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Node Version**: 18.x

## Database Setup

1. Create PostgreSQL database
2. Run migrations:
   ```bash
   cd apps/app
   npx prisma migrate deploy
   ```
3. Update `DATABASE_URL` environment variable

## Security Configuration

### Headers
Both microfrontends include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (app only)

### Authentication
- Uses `better-auth` with PostgreSQL
- Session cookies shared across `.atlasdata.coop` domain
- Middleware protection on all app routes

## Custom Domains

### DNS Configuration
```
# A Records
atlasdata.coop      → Vercel IP (marketing)
app.atlasdata.coop  → Vercel IP (app)

# CNAME Records (alternative)
atlasdata.coop      → cname.vercel-dns.com
app.atlasdata.coop  → cname.vercel-dns.com
```

### SSL Certificates
Vercel automatically provides SSL certificates for custom domains.

## Monitoring and Analytics

### Performance Monitoring
- Vercel Analytics enabled for both apps
- Core Web Vitals tracking
- Real User Monitoring (RUM)

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for infrastructure monitoring

## Troubleshooting

### Build Failures
1. Ensure shared packages are built first: `pnpm run build:packages`
2. Check TypeScript errors: `pnpm run lint:all`
3. Verify environment variables are set

### Authentication Issues
1. Verify `BETTER_AUTH_SECRET` is consistent
2. Check database connectivity
3. Ensure cookies can be shared across subdomains

### Cross-Microfrontend Navigation
1. Verify `NEXT_PUBLIC_*_URL` variables are correct
2. Check CORS configuration
3. Test redirects and rewrites

## Rollback Strategy

### Quick Rollback
```bash
# Rollback to previous deployment
vercel --prod --yes apps/marketing
vercel --prod --yes apps/app
```

### Database Rollback
```bash
# Rollback database migrations if needed
cd apps/app
npx prisma migrate rollback
```

## Performance Optimization

### Marketing Microfrontend
- Static generation for all pages
- Image optimization with Next.js
- Preload critical resources

### App Microfrontend
- Code splitting by route
- Lazy loading for heavy components
- API route optimization
- Database query optimization

## Scaling Considerations

### Traffic Patterns
- Marketing: High read, low write
- App: User-specific, authenticated traffic

### Caching Strategy
- Marketing: Long-term caching (CDN)
- App: Session-based caching

### Database Scaling
- Read replicas for analytics
- Connection pooling
- Query optimization
