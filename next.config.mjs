/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    // Remove all console.* in production bundles except errors.
    // Set to true to remove everything including errors:
    // removeConsole: true,
    removeConsole: { exclude: ['error'] },
  },
  // Show detailed errors in production for debugging
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Enable detailed error reporting
  productionBrowserSourceMaps: true,
  // Custom error handling
  async rewrites() {
    return []
  },
  // Enable logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
