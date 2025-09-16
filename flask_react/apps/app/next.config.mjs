/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@atlas/ui', '@atlas/auth', '@atlas/config'],
  env: {
    MICROFRONTEND_TYPE: 'app',
    MARKETING_URL: process.env.NODE_ENV === 'production' ? 'https://atlasdata.coop' : 'http://localhost:3000',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Rewrite specific API calls to Flask server (not auth routes)
      {
        source: '/api/evals/:path*',
        destination: 'http://localhost:5601/api/evals/:path*',
      },
      {
        source: '/api/upload/:path*',
        destination: 'http://localhost:5601/api/upload/:path*',
      },
      {
        source: '/api/extract/:path*',
        destination: 'http://localhost:5601/api/extract/:path*',
      },
      {
        source: '/api/documents/:path*',
        destination: 'http://localhost:5601/api/documents/:path*',
      },
      // Rewrite marketing pages to marketing microfrontend
      {
        source: '/why-atlas',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://atlasdata.coop/why-atlas' 
          : 'http://localhost:3000/why-atlas',
      },
      {
        source: '/why-tokenize',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://atlasdata.coop/why-tokenize' 
          : 'http://localhost:3000/why-tokenize',
      }
    ];
  },
  async redirects() {
    return [
      // Redirect root to marketing if not authenticated
      // This will be handled by middleware for authenticated users
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  }
};

export default nextConfig;