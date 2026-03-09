import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/audit/"],
      },
    ],
    sitemap: "https://www.uxlens.pro/sitemap.xml",
  };
}
