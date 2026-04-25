import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ No 'output: export' if you want middleware
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
