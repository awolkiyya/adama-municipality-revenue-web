import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  allowedDevOrigins: ["192.168.3.1", "172.25.10.74"],

  experimental: {
    proxyClientMaxBodySize: "64mb",
  },

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const normalizedApiUrl = apiUrl.replace(/\/+$/, "");

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