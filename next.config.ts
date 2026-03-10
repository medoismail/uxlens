import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium-min"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ssilyuhudopitythzryr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://app.lemonsqueezy.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.uxlens.pro https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.uxlens.pro",
              "img-src 'self' data: blob: https://ssilyuhudopitythzryr.supabase.co https://*.clerk.com https://img.clerk.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.uxlens.pro https://api.lemonsqueezy.com https://api.openai.com https://api.microlink.io https://www.google-analytics.com https://ssilyuhudopitythzryr.supabase.co https://challenges.cloudflare.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.uxlens.pro https://app.lemonsqueezy.com https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
