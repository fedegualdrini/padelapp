import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force Vercel cache invalidation - version key
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  // Explicitly set workspace root to avoid detection issues
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
