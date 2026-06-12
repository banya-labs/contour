import type { NextConfig } from "next";
import "./lib/load-contour-env";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@contour/config", "@contour/db"],
};

export default nextConfig;
