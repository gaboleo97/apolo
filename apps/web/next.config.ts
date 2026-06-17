import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@apolo/core",
    "@apolo/database",
    "@apolo/auth",
    "@apolo/ui",
    "@apolo/email",
    "@apolo/module-inventory",
  ],
};

export default nextConfig;
