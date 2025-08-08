import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    
    // Debug: Log the current directory and paths
    console.log('Webpack __dirname:', __dirname)
    console.log('Resolving @/lib to:', path.resolve(__dirname, 'lib'))
    
    // Add path aliases for webpack with explicit paths
    const aliases = {
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/components': path.resolve(__dirname, 'components'), 
      '@/app': path.resolve(__dirname, 'app'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@': path.resolve(__dirname),
    }
    
    console.log('Webpack aliases:', aliases)
    
    config.resolve.alias = {
      ...config.resolve.alias,
      ...aliases,
    }
    
    // Ensure we preserve the existing extensions
    config.resolve.extensions = config.resolve.extensions || []
    if (!config.resolve.extensions.includes('.ts')) {
      config.resolve.extensions.unshift('.ts', '.tsx')
    }
    
    config.module.rules.push({
      test: /\.node$/,
      loader: 'null-loader',
    })
    
    return config
  }
};

export default nextConfig;