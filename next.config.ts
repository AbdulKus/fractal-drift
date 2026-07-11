import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = githubPages
  ? {
      output: "export",
      basePath,
      assetPrefix: basePath,
      trailingSlash: true,
      // The Sites starter includes unused Cloudflare-only helpers whose module
      // types are unavailable to the plain Next.js static exporter.
      typescript: { ignoreBuildErrors: true },
    }
  : {};

export default nextConfig;
