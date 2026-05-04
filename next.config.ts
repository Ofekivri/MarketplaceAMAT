import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output produces a self-contained server bundle for Docker-based
  // hosts (Fly.io, Cloud Run, Railway with custom Dockerfile). Vercel ignores it.
  output: "standalone",
  experimental: {
    serverActions: {
      // Photos are capped at 4 MB each, up to 6 per offer.
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
