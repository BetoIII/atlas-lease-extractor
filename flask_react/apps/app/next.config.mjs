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
  webpack: (config, { isServer }) => {
    // Handle canvas for both client and server
    config.resolve.alias.canvas = false
    
    // Add path aliases for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@/lib': require('path').resolve(__dirname, 'lib'),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/app': require('path').resolve(__dirname, 'app'),
      '@/hooks': require('path').resolve(__dirname, 'hooks'),
    }
    
    config.module.rules.push({
      test: /\.node$/,
      loader: 'null-loader',
    })
    
    return config
  }
};

export default nextConfig;