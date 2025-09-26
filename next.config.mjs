/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    // Force detailed errors in production
    serverMinification: false,
  },
  // Enable source maps in production
  productionBrowserSourceMaps: true,
  // Disable minification to preserve error messages
  swcMinify: false,
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
  // Environment variables
  env: {
    SHOW_DETAILED_ERRORS: 'true',
    NODE_ENV: process.env.NODE_ENV,
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
