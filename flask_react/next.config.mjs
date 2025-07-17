/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove problematic settings that interfere with Fast Refresh
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Add canvas loader (keep existing functionality)
    config.module.rules.push({
      test: /node_modules\/canvas/,
      use: 'null-loader'
    });

    // Handle PDF.js worker (keep existing functionality)  
    config.resolve.alias.canvas = false;
    
    return config;
  },
}

export default nextConfig
