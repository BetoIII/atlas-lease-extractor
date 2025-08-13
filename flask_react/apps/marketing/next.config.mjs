/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@atlas/ui', '@atlas/auth', '@atlas/config'],
  env: {
    MICROFRONTEND_TYPE: 'marketing',
  },
  async rewrites() {
    return [
      // Redirect auth routes to app microfrontend
      {
        source: '/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/:path*`,
      }
    ];
  },
  async redirects() {
    return [
      // Redirect authenticated routes to app microfrontend
      {
        source: '/dashboard/:path*',
        destination: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/:path*`,
        permanent: false,
      },
      {
        source: '/try-it-now/:path*',
        destination: `${process.env.NEXT_PUBLIC_APP_URL || ''}/try-it-now/:path*`,
        permanent: false,
      }
    ];
  }
};

export default nextConfig;