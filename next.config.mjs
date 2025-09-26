/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    // Force detailed errors in production
    serverMinification: false,
  },
  // Enable source maps in production
  productionBrowserSourceMaps: true,
  // Enable detailed logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Custom webpack config to preserve error details
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Preserve error messages in production
      config.optimization.minimize = false;
    }
    return config;
  },
  // Environment variables (removed NODE_ENV as it's not allowed)
  env: {
    SHOW_DETAILED_ERRORS: 'true',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig
