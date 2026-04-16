import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Requerido para Cloudflare Workers con @cloudflare/next-on-pages
  experimental: {
    // App Router está habilitado por defecto en Next.js 15
  },
}

export default nextConfig
