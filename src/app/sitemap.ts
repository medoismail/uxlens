import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.uxlens.pro";

  return [
    {
      url: base,
      lastModified: "2026-03-09",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/pricing`,
      lastModified: "2026-03-09",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
