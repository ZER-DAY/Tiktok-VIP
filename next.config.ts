import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel creates its own deployment output. Standalone is only needed by
  // the self-hosted Docker image.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default withNextIntl(nextConfig);
