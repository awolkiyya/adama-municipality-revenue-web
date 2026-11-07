
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

const normalizedApiUrl = apiUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Production Docker deployment
  output: "standalone",

  // React
  reactStrictMode: true,

  // Security
  poweredByHeader: false,

  // Development only
  allowedDevOrigins: ["192.168.3.1", "172.25.10.74"],

  // Request body size for proxy operations
  experimental: {
    proxyClientMaxBodySize: "64mb",
  },

  // Laravel API and Sanctum proxy
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedApiUrl}/api/v1/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${normalizedApiUrl}/sanctum/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
