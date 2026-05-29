import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the multiple lockfiles warning (we have one at the workspace root)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
