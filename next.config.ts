import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://whop.com https://*.whop.com",
              "style-src 'self' 'unsafe-inline' https://whop.com https://*.whop.com",
              "img-src 'self' data: blob: https: https://whop.com https://*.whop.com",
              "font-src 'self' data: https://whop.com https://*.whop.com",
              "frame-src 'self' https://whop.com https://*.whop.com",
              "connect-src 'self' https://whop.com https://*.whop.com https://api.whop.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
