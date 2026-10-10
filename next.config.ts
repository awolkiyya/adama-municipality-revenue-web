import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  allowedDevOrigins: ["192.168.3.1", "172.25.10.74"],

  // Allow large request bodies when Next.js uses its proxy.
  experimental: {
    proxyClientMaxBodySize: "64mb",
  },

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not configured.");
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/+$/, "")}/api/v1/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${apiUrl.replace(/\/+$/, "")}/sanctum/:path*`,
      },
      {
        source: "/ai/:path*",
        destination: `${baseUrl.replace(/\/+$/, "")}:11434/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
