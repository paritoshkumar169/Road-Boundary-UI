import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb' // Increase to 10MB or whatever limit you need
    },
  },
}
export default nextConfig;
