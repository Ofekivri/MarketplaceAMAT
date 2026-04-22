import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Photos are capped at 4 MB each, up to 6 per offer.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
