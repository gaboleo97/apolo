import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
