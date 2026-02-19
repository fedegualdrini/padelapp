import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force Vercel cache invalidation - version key
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
