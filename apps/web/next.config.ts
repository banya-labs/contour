import type { NextConfig } from "next";
import "./lib/load-contour-env";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@contour/config"],
  serverExternalPackages: ["@contour/db"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: false,
    workerThreads: true,
  },
};

export default nextConfig;