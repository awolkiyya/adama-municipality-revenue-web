import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // --------------------------------------------------------
  // SECURITY
  // --------------------------------------------------------
  // Prevent Next.js from exposing:
  // X-Powered-By: Next.js
  poweredByHeader: false,

  allowedDevOrigins: ['192.168.3.1'],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
  
      {
        source: "/sanctum/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/sanctum/:path*`,
      },
  
      {
        source: "/ai/:path*",
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}:11434/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);