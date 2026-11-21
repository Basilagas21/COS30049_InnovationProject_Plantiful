import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone public visitor site. Intentionally minimal — this app has
  // no auth, no Supabase, no server actions, and nothing to protect with
  // the stricter headers the main `web` app uses.
};

export default nextConfig;
