import type { NextConfig } from "next";

/**
 * `basePath` is only applied in the GitHub Pages build (the workflow sets
 * PAGES_BASE_PATH to "/<repo>"). Local dev and previews stay at the root.
 */
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
