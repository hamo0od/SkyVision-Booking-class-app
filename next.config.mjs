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
  serverActions: {
    bodySizeLimit: '20mb',
  },
}

export default nextConfig
