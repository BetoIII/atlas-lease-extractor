/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@atlas/ui', '@atlas/auth', '@atlas/config'],
  env: {
    MICROFRONTEND_TYPE: 'marketing',
    APP_URL: process.env.NODE_ENV === 'production' ? 'https://app.atlasdata.coop' : 'http://localhost:3001',
  },
  async rewrites() {
    return [
      // Redirect auth routes to app microfrontend
      {
        source: '/auth/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://app.atlasdata.coop/auth/:path*' 
          : 'http://localhost:3001/auth/:path*',
      }
    ];
  },
  async redirects() {
    return [
      // Redirect authenticated routes to app microfrontend
      {
        source: '/dashboard/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://app.atlasdata.coop/dashboard/:path*' 
          : 'http://localhost:3001/dashboard/:path*',
        permanent: false,
      },
      {
        source: '/try-it-now/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://app.atlasdata.coop/try-it-now/:path*' 
          : 'http://localhost:3001/try-it-now/:path*',
        permanent: false,
      }
    ];
  }
};

export default nextConfig;