import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
    formats: ['image/avif', 'image/webp'],
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default withBundleAnalyzer(nextConfig);
