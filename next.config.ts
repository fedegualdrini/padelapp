import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force Vercel cache invalidation - version key
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  },
};

export default nextConfig;
