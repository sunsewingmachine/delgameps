// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      // leave empty or add options when needed
    },
  },
};

export default nextConfig;
