/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add canvas loader
    config.module.rules.push({
      test: /node_modules\/canvas/,
      use: 'null-loader'
    });

    // Handle PDF.js worker
    config.resolve.alias.canvas = false;
    
    return config;
  },
}

module.exports = nextConfig 