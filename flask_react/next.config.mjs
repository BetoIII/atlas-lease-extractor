import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@atlas/ui', '@atlas/auth', '@atlas/config'],
  webpack: (config) => {
    // Handle canvas and PDF.js workers
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false
    }
    
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      use: [
        {
          loader: 'null-loader'
        }
      ]
    })
    
    return config
  },
  async redirects() {
    return [
      // Redirect old marketing paths if needed
      {
        source: '/marketing/:path*',
        destination: '/:path*',
        permanent: true,
      }
    ]
  }
}

export default nextConfig