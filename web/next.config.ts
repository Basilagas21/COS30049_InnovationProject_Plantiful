import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["169.254.83.107", "*.app.github.dev"],
  experimental: {
    // GitHub Codespaces forwards requests through *.app.github.dev,
    // which trips the Server Actions origin check.
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;