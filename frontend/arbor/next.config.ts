import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack5: true,
  webpack: (config) => {
    config.externals.push("pino-pretty");
    config.resolve.fallback = { fs: false };

    return config;
  },
};

export default nextConfig;
