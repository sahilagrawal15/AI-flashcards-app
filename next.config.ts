import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable if you're using Supabase Auth with Next.js App Router
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr']
  }
};

export default nextConfig;
