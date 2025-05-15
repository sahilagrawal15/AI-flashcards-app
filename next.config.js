/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Updated config for Next.js 15
  serverExternalPackages: ['@supabase/ssr'],
  // Environment variables that should be available to the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  // Improve performance by swcMinify
  swcMinify: true,
  // Handle API routes
  rewrites: async () => {
    return [];
  }
};

module.exports = nextConfig; 