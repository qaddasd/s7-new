
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
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  async rewrites() {
    // Dev proxy to Express backend on :4000 so client-side apiFetch('/api/...') works locally
    const target = process.env.API_DEV_TARGET || ''
    if (!target) return []
    return [
      { source: '/api/:path*', destination: `${target}/api/:path*` },
      { source: '/auth/:path*', destination: `${target}/auth/:path*` },
      { source: '/courses/:path*', destination: `${target}/courses/:path*` },
      { source: '/uploads/:path*', destination: `${target}/uploads/:path*` },
      { source: '/media/:path*', destination: `${target}/media/:path*` },
    ]
  },
}

export default nextConfig
