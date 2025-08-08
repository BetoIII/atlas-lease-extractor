/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@atlas/ui', '@atlas/auth', '@atlas/config'],
  env: {
    MICROFRONTEND_TYPE: 'app',
    MARKETING_URL: process.env.NODE_ENV === 'production' ? 'https://atlasdata.coop' : 'http://localhost:3000',
  },
  async rewrites() {
    return [
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
    config.module.rules.push({
      test: /\.node$/,
      loader: 'null-loader',
    })
    return config
  }
};

export default nextConfig;