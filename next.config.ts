import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
